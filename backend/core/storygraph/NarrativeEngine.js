const crypto = require("crypto");

class NarrativeEngine {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
  }

  get db() {
    return this.databaseManager.activeDb;
  }

  /**
   * Compiles narrative context for AI/Outline assistance.
   */
  async buildNarrativeContext(projectId, chapterId) {
    if (!this.db) throw new Error("Database not open");

    const chapter = this.db.prepare("SELECT * FROM chapters WHERE id = ?").get(chapterId);
    if (!chapter) throw new Error("Chapter not found");

    const dna = this.db.prepare("SELECT * FROM story_dna WHERE project_id = ?").get(projectId) || {};
    const scenes = this.db.prepare("SELECT * FROM scenes WHERE chapter_id = ? ORDER BY order_index").all(chapterId);
    const links = this.db.prepare(`
      SELECT cl.*, c.title as target_title, c.chapter_number as target_number
      FROM chapter_links cl
      JOIN chapters c ON cl.target_chapter_id = c.id
      WHERE cl.source_chapter_id = ?
    `).all(chapterId);

    const history = this.db.prepare("SELECT * FROM chapter_history WHERE chapter_id = ? ORDER BY created_at DESC").all(chapterId);

    return {
      chapter,
      dna,
      scenes,
      links,
      history
    };
  }

  /**
   * Analyzes story pacing, absence gaps, threads, setups, payoffs and updates story_insights.
   */
  async analyzeStoryPulse(projectId) {
    if (!this.db) throw new Error("Database not open");

    const chapters = this.db.prepare("SELECT * FROM chapters WHERE project_id = ? ORDER BY act_index, order_index").all(projectId);
    const scenes = this.db.prepare("SELECT * FROM scenes WHERE project_id = ? ORDER BY order_index").all(projectId);
    const entities = this.db.prepare("SELECT * FROM entities WHERE project_id = ?").all(projectId);
    const threads = this.db.prepare("SELECT * FROM story_threads WHERE project_id = ?").all(projectId);
    const decisions = this.db.prepare("SELECT * FROM writer_decisions WHERE project_id = ?").all(projectId);

    const activeInsights = [];

    const isDismissed = (topic) => decisions.some(d => d.topic === topic);

    // -- Category: structure --
    const act2Chs = chapters.filter(c => c.act === "Act II");
    if (chapters.length > 5 && act2Chs.length / chapters.length > 0.6) {
      const topic = "act2_imbalance";
      if (!isDismissed(topic)) {
        activeInsights.push({
          category: "structure",
          severity: "warning",
          message: `Act II contains ${Math.round((act2Chs.length / chapters.length) * 100)}% of chapters. Some writers use this pattern for slower middle acts.`,
          topic
        });
      }
    }

    for (const ch of chapters) {
      const chScenes = scenes.filter(s => s.chapter_id === ch.id);
      if (chScenes.length === 0) {
        const topic = `empty_chapter:${ch.id}`;
        if (!isDismissed(topic)) {
          activeInsights.push({
            category: "structure",
            severity: "warning",
            message: `Chapter "${ch.title}" has no active scenes plotted.`,
            topic
          });
        }
      }
    }

    for (let i = 0; i < chapters.length - 1; i++) {
      const currentScenes = scenes.filter(s => s.chapter_id === chapters[i].id).length;
      const nextScenes = scenes.filter(s => s.chapter_id === chapters[i + 1].id).length;
      if (Math.abs(currentScenes - nextScenes) >= 8) {
        const topic = `density_discrepancy:${chapters[i].id}_${chapters[i+1].id}`;
        if (!isDismissed(topic)) {
          activeInsights.push({
            category: "structure",
            severity: "info",
            message: `Possible pacing difference: Chapter "${chapters[i].title}" has ${currentScenes} scenes while next Chapter "${chapters[i+1].title}" has ${nextScenes}.`,
            topic
          });
        }
      }
    }

    // -- Category: characters --
    const characters = entities.filter(e => e.type === "character");
    for (const char of characters) {
      const appearanceChapters = new Set();
      for (const scene of scenes) {
        if (scene.pov_entity_id === char.id) {
          appearanceChapters.add(scene.chapter_id);
        }
      }
      
      let maxAbsence = 0;
      let currentAbsence = 0;
      for (const ch of chapters) {
        if (appearanceChapters.has(ch.id)) {
          if (currentAbsence > maxAbsence) {
            maxAbsence = currentAbsence;
          }
          currentAbsence = 0;
        } else {
          currentAbsence++;
        }
      }
      if (currentAbsence > maxAbsence) {
        maxAbsence = currentAbsence;
      }

      if (maxAbsence > 5) {
        const topic = `character_absence:${char.id}`;
        if (!isDismissed(topic)) {
          activeInsights.push({
            category: "characters",
            severity: "warning",
            message: `Protagonist "${char.title}" has not appeared in scene POVs for ${maxAbsence} consecutive chapters.`,
            topic
          });
        }
      }
    }

    // -- Category: mysteries --
    for (const th of threads) {
      if (th.status === "active") {
        const threadMappings = this.db.prepare("SELECT * FROM thread_chapters WHERE thread_id = ?").all(th.id);
        const hasResolution = threadMappings.some(m => m.role === "resolved");
        if (!hasResolution && threadMappings.length > 0) {
          const introMapping = threadMappings.find(m => m.role === "introduced");
          if (introMapping) {
            const introChIdx = chapters.findIndex(c => c.id === introMapping.chapter_id);
            if (introChIdx !== -1 && chapters.length - introChIdx > 8) {
              const topic = `thread_unresolved:${th.id}`;
              if (!isDismissed(topic)) {
                activeInsights.push({
                  category: "mysteries",
                  severity: "warning",
                  message: `Forgotten Setup: Mystery Thread "${th.name}" was introduced in Chapter ${introChIdx + 1} but remains unresolved after ${chapters.length - introChIdx} chapters.`,
                  topic
                });
              }
            }
          }
        }
      }
    }

    // -- Category: timeline --
    const activeMemoryReports = this.db.prepare("SELECT * FROM continuity_reports WHERE project_id = ? AND status = 'active'").all(projectId);
    for (const rep of activeMemoryReports) {
      const topic = `memory_conflict:${rep.id}`;
      if (!isDismissed(topic)) {
        activeInsights.push({
          category: "timeline",
          severity: rep.confidence >= 0.9 ? "critical" : "warning",
          message: rep.message,
          topic
        });
      }
    }

    this.db.transaction(() => {
      this.db.prepare("DELETE FROM story_insights WHERE project_id = ? AND resolved = 0").run(projectId);

      for (const ins of activeInsights) {
        const id = crypto.randomUUID ? crypto.randomUUID() : require("crypto").randomUUID();
        this.db.prepare(`
          INSERT INTO story_insights (id, project_id, category, severity, message, source, resolved)
          VALUES (?, ?, ?, ?, ?, ?, 0)
        `).run(id, projectId, ins.category, ins.severity, ins.message, "narrative_engine");
      }
    })();

    const insights = this.db.prepare("SELECT * FROM story_insights WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
    return {
      stable: insights.length === 0,
      insights
    };
  }
}

module.exports = NarrativeEngine;
