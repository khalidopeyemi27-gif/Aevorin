const express = require("express");
const kernel = require("../../kernel/ApplicationKernel");
const NarrativeEngine = require("../storygraph/NarrativeEngine");

const router = express.Router({ mergeParams: true });
const narrativeEngine = new NarrativeEngine(kernel.getContainer().get("databaseManager"));

// Resolve services helper
const getServices = () => {
  const container = kernel.getContainer();
  return {
    chapterService: container.get("chapterService"),
    sceneService: container.get("sceneService"),
    searchService: container.get("searchService"),
    analyticsService: container.get("analyticsService"),
    backupManager: container.get("backupManager"),
    versionService: container.get("versionService"),
    aiContextService: container.get("aiContextService")
  };
};

/**
 * Lists chapters in project.
 */
router.get("/chapters", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { chapterService } = getServices();
    const list = await chapterService.getChapters(projectId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates chapter.
 */
router.post("/chapters", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, act, purpose, status } = req.body;
    const { chapterService } = getServices();
    const chapter = await chapterService.createChapter(projectId, title);
    
    // Support initializing story progression fields directly in SQLite database
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (db && (act || purpose || status)) {
      db.prepare(`
        UPDATE chapters
        SET act = COALESCE(?, act),
            purpose = COALESCE(?, purpose),
            status = COALESCE(?, status)
        WHERE id = ?
      `).run(act || null, purpose || null, status || null, chapter.id);

      const updated = db.prepare(`SELECT * FROM chapters WHERE id = ?`).get(chapter.id);
      Object.assign(chapter, updated);
    }

    // Update stats
    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.status(201).json(chapter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Bulk updates chapter order indexes and act associations.
 */
router.put("/chapters/reorder", async (req, res) => {
  try {
    const { chapters } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    db.transaction(() => {
      for (const ch of chapters) {
        db.prepare(`
          UPDATE chapters
          SET order_index = ?,
              act_index = ?,
              act = ?
          WHERE id = ?
        `).run(ch.order_index, ch.act_index, ch.act, ch.id);
      }
    })();

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Fetches consolidated chapter context for Chapter Detail Screen.
 */
router.get("/chapters/:chapterId/context", async (req, res) => {
  try {
    const { id: projectId, chapterId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    // 1. Fetch chapter
    const chapter = db.prepare(`SELECT * FROM chapters WHERE id = ?`).get(chapterId);
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });

    // 2. Fetch scenes
    const scenes = db.prepare(`SELECT * FROM scenes WHERE chapter_id = ? ORDER BY order_index ASC`).all(chapterId);

    // 3. Derived characters
    const allCharacters = db.prepare(`SELECT * FROM entities WHERE project_id = ? AND type = 'character'`).all(projectId);
    const activeCharacters = [];
    const seenCharIds = new Set();
    
    for (const sc of scenes) {
      if (sc.pov_entity_id && !seenCharIds.has(sc.pov_entity_id)) {
        const chr = allCharacters.find(c => c.id === sc.pov_entity_id);
        if (chr) {
          activeCharacters.push(chr);
          seenCharIds.add(sc.pov_entity_id);
        }
      }
      const summaryText = (sc.summary || "").toLowerCase();
      for (const chr of allCharacters) {
        if (seenCharIds.has(chr.id)) continue;
        const nameLower = chr.title.toLowerCase();
        if (summaryText.includes(nameLower)) {
          activeCharacters.push(chr);
          seenCharIds.add(chr.id);
        }
      }
    }

    // 4. Memory changes
    const chapterPositionKeys = scenes.map(sc => {
      const chIdx = String(chapter.act_index).padStart(3, "0");
      const scIdx = String(sc.order_index).padStart(3, "0");
      return `${chIdx}.${scIdx}`;
    });

    let memoryChanges = [];
    if (chapterPositionKeys.length > 0) {
      const placeholders = chapterPositionKeys.map(() => "?").join(",");
      const charChanges = db.prepare(`
        SELECT cc.*, e.title as character_name
        FROM character_changes cc
        JOIN entities e ON cc.character_id = e.id
        WHERE cc.project_id = ? AND cc.position_key IN (${placeholders})
      `).all(projectId, ...chapterPositionKeys);

      const relChanges = db.prepare(`
        SELECT rc.*, e1.title as character_a_name, e2.title as character_b_name
        FROM relationship_changes rc
        JOIN entities e1 ON rc.character_a = e1.id
        JOIN entities e2 ON rc.character_b = e2.id
        WHERE rc.project_id = ? AND rc.position_key IN (${placeholders})
      `).all(projectId, ...chapterPositionKeys);

      memoryChanges = [
        ...charChanges.map(c => ({
          type: "character",
          event: `Character status updated`,
          character: c.character_name,
          change: `${c.field}: ${c.old_value || "None"} → ${c.new_value}`
        })),
        ...relChanges.map(r => ({
          type: "relationship",
          event: `Relationship evolved`,
          character: `${r.character_a_name} + ${r.character_b_name}`,
          change: `${r.old_relationship || "None"} → ${r.new_relationship}`
        }))
      ];
    }

    // 5. Warnings/continuity reports
    const warnings = db.prepare(`
      SELECT r.*, e.title as affected_character
      FROM continuity_reports r
      LEFT JOIN entities e ON r.affected_entity_id = e.id
      WHERE r.project_id = ? AND r.status = 'active'
    `).all(projectId);

    const filteredWarnings = warnings.filter(w => seenCharIds.has(w.affected_entity_id));

    // 6. Chapter State History
    const history = db.prepare(`
      SELECT * FROM chapter_history
      WHERE chapter_id = ?
      ORDER BY created_at DESC
    `).all(chapterId);

    // 7. Chapter Link relations
    const outgoingLinks = db.prepare(`
      SELECT cl.*, c.title as target_title, c.chapter_number as target_number
      FROM chapter_links cl
      JOIN chapters c ON cl.target_chapter_id = c.id
      WHERE cl.source_chapter_id = ?
    `).all(chapterId);

    const incomingLinks = db.prepare(`
      SELECT cl.*, c.title as source_title, c.chapter_number as source_number
      FROM chapter_links cl
      JOIN chapters c ON cl.source_chapter_id = c.id
      WHERE cl.target_chapter_id = ?
    `).all(chapterId);

    // 8. Story Memories Snapshots
    const versions = db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_id = ?
      ORDER BY created_at DESC
    `).all(chapterId);

    res.json({
      chapter,
      scenes: scenes.map(s => ({
        id: s.id,
        title: s.title,
        goal: s.purpose || "",
        conflict: s.conflict || "",
        word_count: s.wordCount || 0
      })),
      characters: activeCharacters.map(c => ({
        id: c.id,
        name: c.title,
        role: (c.metadata && typeof c.metadata === "string" ? JSON.parse(c.metadata) : c.metadata)?.roleType || "supporting"
      })),
      memoryChanges,
      warnings: filteredWarnings,
      history,
      links: {
        outgoing: outgoingLinks,
        incoming: incomingLinks
      },
      versions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Updates chapter metadata.
 */
router.put("/chapters/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const {
      title, act, purpose, status, act_index, order_index, summary, conflict, goal,
      chapter_number, timeline_position, estimated_word_count, notes,
      emotional_target, reader_effect, theme_focus, chapter_question, turning_point, consequence,
      change_reason, source
    } = req.body;
    
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const oldChapter = db.prepare("SELECT * FROM chapters WHERE id = ?").get(chapterId);
    if (!oldChapter) throw new Error("Chapter not found");

    db.prepare(`
      UPDATE chapters
      SET title = COALESCE(?, title),
          act = COALESCE(?, act),
          purpose = COALESCE(?, purpose),
          status = COALESCE(?, status),
          act_index = COALESCE(?, act_index),
          order_index = COALESCE(?, order_index),
          summary = COALESCE(?, summary),
          conflict = COALESCE(?, conflict),
          goal = COALESCE(?, goal),
          chapter_number = COALESCE(?, chapter_number),
          timeline_position = COALESCE(?, timeline_position),
          estimated_word_count = COALESCE(?, estimated_word_count),
          notes = COALESCE(?, notes),
          emotional_target = COALESCE(?, emotional_target),
          reader_effect = COALESCE(?, reader_effect),
          theme_focus = COALESCE(?, theme_focus),
          chapter_question = COALESCE(?, chapter_question),
          turning_point = COALESCE(?, turning_point),
          consequence = COALESCE(?, consequence),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title !== undefined ? title : null,
      act !== undefined ? act : null,
      purpose !== undefined ? purpose : null,
      status !== undefined ? status : null,
      act_index !== undefined ? act_index : null,
      order_index !== undefined ? order_index : null,
      summary !== undefined ? summary : null,
      conflict !== undefined ? conflict : null,
      goal !== undefined ? goal : null,
      chapter_number !== undefined ? chapter_number : null,
      timeline_position !== undefined ? timeline_position : null,
      estimated_word_count !== undefined ? estimated_word_count : null,
      notes !== undefined ? notes : null,
      emotional_target !== undefined ? emotional_target : null,
      reader_effect !== undefined ? reader_effect : null,
      theme_focus !== undefined ? theme_focus : null,
      chapter_question !== undefined ? chapter_question : null,
      turning_point !== undefined ? turning_point : null,
      consequence !== undefined ? consequence : null,
      chapterId
    );

    const fieldsToTrack = [
      'title', 'act', 'purpose', 'status', 'summary', 'conflict', 'goal',
      'emotional_target', 'reader_effect', 'theme_focus', 'chapter_question', 'turning_point', 'consequence'
    ];
    for (const field of fieldsToTrack) {
      const newValue = req.body[field];
      if (newValue !== undefined && newValue !== null && String(newValue) !== String(oldChapter[field] || '')) {
        const historyId = require("crypto").randomUUID();
        db.prepare(`
          INSERT INTO chapter_history (id, chapter_id, field, old_value, new_value, change_reason, source)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          historyId,
          chapterId,
          field,
          String(oldChapter[field] || ''),
          String(newValue),
          change_reason || '',
          source || 'manual'
        );
      }
    }

    const updated = db.prepare(`SELECT * FROM chapters WHERE id = ?`).get(chapterId);

    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Deletes chapter.
 */
router.delete("/chapters/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { chapterService } = getServices();
    await chapterService.deleteChapter(chapterId);
    
    // Update stats
    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Lists scenes in project.
 */
router.get("/scenes", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { sceneService } = getServices();
    const list = await sceneService.getScenes(projectId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates scene.
 */
router.post("/scenes", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { chapterId, title } = req.body;
    const { sceneService } = getServices();
    const scene = await sceneService.createScene(projectId, chapterId, title);
    
    // Update stats
    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.status(201).json(scene);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Updates scene content/metadata.
 */
router.put("/scenes/:sceneId", async (req, res) => {
  try {
    const { sceneId } = req.params;
    const updates = req.body;
    const { sceneService } = getServices();
    const scene = await sceneService.updateScene(sceneId, updates);
    
    // Update stats
    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.json(scene);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Reorders list of scenes.
 */
router.post("/scenes/reorder", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { orders } = req.body;
    const { sceneService } = getServices();
    await sceneService.reorderScenes(projectId, orders);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Deletes scene.
 */
router.delete("/scenes/:sceneId", async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { sceneService } = getServices();
    await sceneService.deleteScene(sceneId);
    
    // Update stats
    const projectManager = kernel.getContainer().get("projectManager");
    if (projectManager.activeProjectName) {
      projectManager.updateProjectStats(projectManager.activeProjectName).catch(console.error);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Narrative search engine filter endpoint.
 */
router.get("/search", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { query } = req.query; // ?query=status:draft
    const { searchService } = getServices();
    const results = await searchService.search(projectId, query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analytics statistics generator.
 */
router.get("/analytics", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { analyticsService } = getServices();
    const stats = await analyticsService.computeAnalytics(projectId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Backups endpoints.
 */
router.get("/backups", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { backupManager } = getServices();
    const list = await backupManager.listBackups(projectId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/backups", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { backupManager } = getServices();
    const fileName = await backupManager.createBackup(projectId);
    res.status(201).json({ success: true, fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/backups/restore", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { fileName } = req.body;
    const { backupManager } = getServices();
    await backupManager.restoreBackup(projectId, fileName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Version History checkpoints.
 */
router.get("/history", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { entityId, entityType } = req.query; // ?entityId=...&entityType=scene
    const { versionService } = getServices();
    const history = await versionService.getHistory(entityId, entityType, projectId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/history/:versionId", async (req, res) => {
  try {
    const { versionId } = req.params;
    const { versionService } = getServices();
    const detail = await versionService.getVersionById(versionId);
    if (!detail) {
      return res.status(404).json({ error: "Version checkpoint not found" });
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/history", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { entityId, entityType, content, summary } = req.body;
    const { versionService } = getServices();
    const result = await versionService.createVersion(projectId, entityType, entityId, content, summary);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/history/restore", async (req, res) => {
  try {
    const { versionId } = req.body;
    const { versionService } = getServices();
    const result = await versionService.restoreVersion(versionId);
    res.json({ success: true, restored: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Exposes LLM structured context diagnostics.
 */
router.get("/scenes/:sceneId/context", async (req, res) => {
  try {
    const { id: projectId, sceneId } = req.params;
    const { aiContextService } = getServices();
    const context = await aiContextService.buildSceneAIContext(projectId, sceneId);
    res.json({
      success: true,
      context
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compiles manuscript draft in selected format.
 */
router.post("/export", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { format } = req.body; // 'markdown', 'html', 'docx', 'pdf'
    const exportService = kernel.getContainer().get("exportService");
    const result = await exportService.exportManuscript(projectId, format || "markdown");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// AEVORIN Narrative Intelligence API Routes
// ==========================================

/**
 * Gets project Story DNA theme settings.
 */
router.get("/story-dna", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    let dna = db.prepare("SELECT * FROM story_dna WHERE project_id = ?").get(projectId);
    if (!dna) {
      // Default initialization
      const id = require("crypto").randomUUID();
      db.prepare(`
        INSERT INTO story_dna (id, project_id, theme, core_question, reader_promise, genre, tone, ending_feeling, world_rules, main_character_arc, central_conflict)
        VALUES (?, ?, '', '', '', '', '', '', '', '', '')
      `).run(id, projectId);
      dna = db.prepare("SELECT * FROM story_dna WHERE project_id = ?").get(projectId);
    }
    res.json(dna);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Saves project Story DNA theme settings.
 */
router.put("/story-dna", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { theme, core_question, reader_promise, genre, tone, ending_feeling, world_rules, main_character_arc, central_conflict } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    db.prepare(`
      UPDATE story_dna
      SET theme = COALESCE(?, theme),
          core_question = COALESCE(?, core_question),
          reader_promise = COALESCE(?, reader_promise),
          genre = COALESCE(?, genre),
          tone = COALESCE(?, tone),
          ending_feeling = COALESCE(?, ending_feeling),
          world_rules = COALESCE(?, world_rules),
          main_character_arc = COALESCE(?, main_character_arc),
          central_conflict = COALESCE(?, central_conflict)
      WHERE project_id = ?
    `).run(
      theme !== undefined ? theme : null,
      core_question !== undefined ? core_question : null,
      reader_promise !== undefined ? reader_promise : null,
      genre !== undefined ? genre : null,
      tone !== undefined ? tone : null,
      ending_feeling !== undefined ? ending_feeling : null,
      world_rules !== undefined ? world_rules : null,
      main_character_arc !== undefined ? main_character_arc : null,
      central_conflict !== undefined ? central_conflict : null,
      projectId
    );

    const updated = db.prepare("SELECT * FROM story_dna WHERE project_id = ?").get(projectId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Gets all narrative threads for a project.
 */
router.get("/story-threads", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const threads = db.prepare("SELECT * FROM story_threads WHERE project_id = ?").all(projectId);
    
    // Map chapters mappings into the threads response
    for (const th of threads) {
      th.chapters = db.prepare(`
        SELECT tc.*, c.title as chapter_title, c.chapter_number
        FROM thread_chapters tc
        JOIN chapters c ON tc.chapter_id = c.id
        WHERE tc.thread_id = ?
      `).all(th.id);
    }
    
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates a story thread.
 */
router.post("/story-threads", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { name, type, description, created_chapter } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const threadId = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO story_threads (id, project_id, name, type, description, created_chapter, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(threadId, projectId, name, type, description || '', created_chapter || '');

    const created = db.prepare("SELECT * FROM story_threads WHERE id = ?").get(threadId);
    created.chapters = [];
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deletes a story thread.
 */
router.delete("/story-threads/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    db.prepare("DELETE FROM story_threads WHERE id = ?").run(threadId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Maps a thread to a chapter.
 */
router.post("/story-threads/:threadId/chapters", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { chapterId, role } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const id = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO thread_chapters (id, thread_id, chapter_id, role)
      VALUES (?, ?, ?, ?)
    `).run(id, threadId, chapterId, role);

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Removes a thread chapter mapping.
 */
router.delete("/story-threads/:threadId/chapters/:chapterId", async (req, res) => {
  try {
    const { threadId, chapterId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    db.prepare("DELETE FROM thread_chapters WHERE thread_id = ? AND chapter_id = ?").run(threadId, chapterId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Gets links for all chapters.
 */
router.get("/chapters/links", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const links = db.prepare(`
      SELECT cl.*, c1.title as source_title, c2.title as target_title
      FROM chapter_links cl
      JOIN chapters c1 ON cl.source_chapter_id = c1.id
      JOIN chapters c2 ON cl.target_chapter_id = c2.id
      WHERE cl.project_id = ?
    `).all(projectId);
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates a link.
 */
router.post("/chapters/links", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { source_chapter_id, target_chapter_id, relationship, strength, description } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const linkId = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO chapter_links (id, project_id, source_chapter_id, target_chapter_id, relationship, strength, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(linkId, projectId, source_chapter_id, target_chapter_id, relationship, strength || 50, description || '');

    const created = db.prepare("SELECT * FROM chapter_links WHERE id = ?").get(linkId);
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deletes a link.
 */
router.delete("/chapters/links/:linkId", async (req, res) => {
  try {
    const { linkId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    db.prepare("DELETE FROM chapter_links WHERE id = ?").run(linkId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Lists full-project story snapshots.
 */
router.get("/story-snapshots", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const snapshots = db.prepare("SELECT * FROM story_snapshots WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates full-project outline snapshot.
 */
router.post("/story-snapshots", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { name, description, version_type } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    // Gather chapters, scenes, and links to bundle in snapshot JSON
    const chapters = db.prepare("SELECT * FROM chapters WHERE project_id = ?").all(projectId);
    const scenes = db.prepare("SELECT * FROM scenes WHERE project_id = ?").all(projectId);
    const links = db.prepare("SELECT * FROM chapter_links WHERE project_id = ?").all(projectId);
    const threads = db.prepare("SELECT * FROM story_threads WHERE project_id = ?").all(projectId);

    const snapshot_json = JSON.stringify({ chapters, scenes, links, threads });

    const id = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO story_snapshots (id, project_id, snapshot_json, name, description, version_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, projectId, snapshot_json, name, description || '', version_type || 'manual');

    const created = db.prepare("SELECT * FROM story_snapshots WHERE id = ?").get(id);
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Safely restores full-project outline snapshot.
 */
router.post("/story-snapshots/:snapshotId/restore", async (req, res) => {
  try {
    const { id: projectId, snapshotId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const snapshot = db.prepare("SELECT * FROM story_snapshots WHERE id = ?").get(snapshotId);
    if (!snapshot) throw new Error("Snapshot memory not found");

    const data = JSON.parse(snapshot.snapshot_json);

    db.transaction(() => {
      // 1. Create a quiet auto-backup before restoration overwrite
      const prevChapters = db.prepare("SELECT * FROM chapters WHERE project_id = ?").all(projectId);
      const prevScenes = db.prepare("SELECT * FROM scenes WHERE project_id = ?").all(projectId);
      const prevLinks = db.prepare("SELECT * FROM chapter_links WHERE project_id = ?").all(projectId);
      const prevThreads = db.prepare("SELECT * FROM story_threads WHERE project_id = ?").all(projectId);
      const autoBackupJson = JSON.stringify({ chapters: prevChapters, scenes: prevScenes, links: prevLinks, threads: prevThreads });
      
      const backupId = require("crypto").randomUUID();
      db.prepare(`
        INSERT INTO story_snapshots (id, project_id, snapshot_json, name, description, version_type)
        VALUES (?, ?, ?, 'Auto Backup', 'System backup taken prior to restoring snapshot', 'auto_backup')
      `).run(backupId, projectId, autoBackupJson);

      // 2. Wipe active outline tables
      db.prepare("DELETE FROM chapter_links WHERE project_id = ?").run(projectId);
      db.prepare("DELETE FROM thread_chapters WHERE thread_id IN (SELECT id FROM story_threads WHERE project_id = ?)").run(projectId);
      db.prepare("DELETE FROM story_threads WHERE project_id = ?").run(projectId);
      db.prepare("DELETE FROM scenes WHERE project_id = ?").run(projectId);
      db.prepare("DELETE FROM chapters WHERE project_id = ?").run(projectId);

      // 3. Restore snapshot parameters
      for (const ch of data.chapters || []) {
        db.prepare(`
          INSERT INTO chapters (id, project_id, title, order_index, act, purpose, status, act_index, summary, conflict, goal, chapter_number, timeline_position, estimated_word_count, notes, emotional_target, reader_effect, theme_focus, chapter_question, turning_point, consequence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ch.id, projectId, ch.title, ch.order_index, ch.act, ch.purpose, ch.status, ch.act_index, ch.summary, ch.conflict, ch.goal, ch.chapter_number, ch.timeline_position, ch.estimated_word_count, ch.notes, ch.emotional_target || '', ch.reader_effect || '', ch.theme_focus || '', ch.chapter_question || '', ch.turning_point || '', ch.consequence || '');
      }

      for (const sc of data.scenes || []) {
        db.prepare(`
          INSERT INTO scenes (id, project_id, chapter_id, title, purpose, conflict, word_count, order_index, status, pov_entity_id, settings, duration_seconds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(sc.id, projectId, sc.chapter_id, sc.title, sc.purpose || '', sc.conflict || '', sc.wordCount || sc.word_count || 0, sc.order_index || 0, sc.status || 'draft', sc.pov_entity_id || null, sc.settings || '{}', sc.duration_seconds || 0);
      }

      for (const cl of data.links || []) {
        db.prepare(`
          INSERT INTO chapter_links (id, project_id, source_chapter_id, target_chapter_id, relationship, strength, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cl.id, projectId, cl.source_chapter_id, cl.target_chapter_id, cl.relationship, cl.strength || 50, cl.description || '');
      }

      for (const th of data.threads || []) {
        db.prepare(`
          INSERT INTO story_threads (id, project_id, name, type, description, created_chapter, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(th.id, projectId, th.name, th.type, th.description || '', th.created_chapter || '', th.status || 'active');
        
        // Restore mappings if included
        if (th.chapters) {
          for (const tc of th.chapters) {
            db.prepare(`
              INSERT INTO thread_chapters (id, thread_id, chapter_id, role)
              VALUES (?, ?, ?, ?)
            `).run(tc.id, th.id, tc.chapter_id, tc.role);
          }
        }
      }
    })();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Lists named recovery snapshot memories for a chapter.
 */
router.get("/chapters/:chapterId/versions", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const versions = db.prepare("SELECT * FROM chapter_versions WHERE chapter_id = ? ORDER BY created_at DESC").all(chapterId);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates named recovery snapshot memory for a chapter.
 */
router.post("/chapters/:chapterId/versions", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { name, description, version_type } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const chapter = db.prepare("SELECT * FROM chapters WHERE id = ?").get(chapterId);
    if (!chapter) throw new Error("Chapter not found");

    const snapshot_json = JSON.stringify(chapter);

    const id = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO chapter_versions (id, chapter_id, snapshot_json, name, description, version_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, chapterId, snapshot_json, name, description || '', version_type || 'manual');

    const created = db.prepare("SELECT * FROM chapter_versions WHERE id = ?").get(id);
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Restores a chapter snapshot memory safely.
 */
router.post("/chapters/:chapterId/versions/:versionId/restore", async (req, res) => {
  try {
    const { chapterId, versionId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const version = db.prepare("SELECT * FROM chapter_versions WHERE id = ?").get(versionId);
    if (!version) throw new Error("Snapshot memory not found");

    const current = db.prepare("SELECT * FROM chapters WHERE id = ?").get(chapterId);
    if (!current) throw new Error("Active chapter not found");

    const ch = JSON.parse(version.snapshot_json);

    db.transaction(() => {
      // 1. Create a backup snapshot of current state first
      const backupId = require("crypto").randomUUID();
      db.prepare(`
        INSERT INTO chapter_versions (id, chapter_id, snapshot_json, name, description, version_type)
        VALUES (?, ?, ?, 'Auto Backup', 'System backup taken prior to restoring memory snapshot', 'auto_backup')
      `).run(backupId, chapterId, JSON.stringify(current));

      // 2. Overwrite database properties
      db.prepare(`
        UPDATE chapters
        SET title = ?,
            act = ?,
            purpose = ?,
            status = ?,
            act_index = ?,
            order_index = ?,
            summary = ?,
            conflict = ?,
            goal = ?,
            chapter_number = ?,
            timeline_position = ?,
            estimated_word_count = ?,
            notes = ?,
            emotional_target = ?,
            reader_effect = ?,
            theme_focus = ?,
            chapter_question = ?,
            turning_point = ?,
            consequence = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        ch.title, ch.act, ch.purpose, ch.status, ch.act_index, ch.order_index,
        ch.summary, ch.conflict, ch.goal, ch.chapter_number, ch.timeline_position,
        ch.estimated_word_count, ch.notes, ch.emotional_target || '', ch.reader_effect || '',
        ch.theme_focus || '', ch.chapter_question || '', ch.turning_point || '', ch.consequence || '',
        chapterId
      );
    })();

    const updated = db.prepare("SELECT * FROM chapters WHERE id = ?").get(chapterId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Returns categorized Story Pulse warnings and pacing insights.
 */
router.get("/chapters/analysis/pulse", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const result = await narrativeEngine.analyzeStoryPulse(projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dismisses a pacing insight and saves a writer_decisions override.
 */
router.post("/chapters/analysis/insights/:insightId/dismiss", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { topic, decision } = req.body;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database not open");

    const id = require("crypto").randomUUID();
    db.prepare(`
      INSERT INTO writer_decisions (id, project_id, topic, decision)
      VALUES (?, ?, ?, ?)
    `).run(id, projectId, topic, decision || 'intentional_mystery');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
