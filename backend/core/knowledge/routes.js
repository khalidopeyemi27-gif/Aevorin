const express = require("express");
const kernel = require("../../kernel/ApplicationKernel");
const { v4: uuidv4 } = require("uuid");

const router = express.Router({ mergeParams: true });

// Resolve service helper
const getEntityService = () => {
  return kernel.getContainer().get("entityService");
};

/**
 * Lists entities.
 */
router.get("/entities", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { type } = req.query; // optional filter ?type=character
    const entityService = getEntityService();
    const list = await entityService.getEntities(projectId, type);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates entity.
 */
router.post("/entities", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { type, title, summary, metadata } = req.body;
    const entityService = getEntityService();
    const entity = await entityService.createEntity(projectId, type, title, summary, metadata);

    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (db && entity) {
      db.prepare(`
        INSERT INTO story_entities (id, project_id, entity_type, name, importance)
        VALUES (?, ?, ?, ?, ?)
      `).run(entity.id, projectId, entity.type, entity.title, 50);
      rebuildGraphCache(db, projectId);
    }

    res.status(201).json(entity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Updates entity.
 */
router.put("/entities/:entityId", async (req, res) => {
  try {
    const { entityId } = req.params;
    const updates = req.body;
    const entityService = getEntityService();
    const entity = await entityService.updateEntity(entityId, updates);

    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (db && entity) {
      db.prepare(`
        UPDATE story_entities
        SET name = ?, importance = ?
        WHERE id = ?
      `).run(entity.title, updates.importance || 50, entity.id);
      const projId = entity.project_id || entity.projectId;
      if (projId) rebuildGraphCache(db, projId);
    }

    res.json(entity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Deletes entity.
 */
router.delete("/entities/:entityId", async (req, res) => {
  try {
    const { entityId } = req.params;
    const entityService = getEntityService();
    
    const db = kernel.getContainer().get("databaseManager").activeDb;
    let projId = null;
    if (db) {
      const ent = db.prepare("SELECT project_id FROM entities WHERE id = ?").get(entityId);
      if (ent) projId = ent.project_id;
    }

    await entityService.deleteEntity(entityId);

    if (db) {
      db.prepare("DELETE FROM story_entities WHERE id = ?").run(entityId);
      db.prepare("DELETE FROM graph_relationships_cache WHERE source_id = ? OR target_id = ?").run(entityId, entityId);
      if (projId) rebuildGraphCache(db, projId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/entities/:entityId/intelligence", async (req, res) => {
  try {
    const { entityId } = req.params;
    const entityService = getEntityService();
    const intel = await entityService.getEntityIntelligence(entityId);
    res.json(intel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- CANON ENGINE ENDPOINTS ---
const getCanonRepository = () => kernel.getContainer().get("canonRepository");
const getCanonService = () => kernel.getContainer().get("canonService");

// 1. Canon Events (Timeline Feed)
router.get("/canon/events", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const repo = getCanonRepository();
    const events = await repo.getCanonEvents(projectId);
    
    // Resolve changes for each event
    const enriched = [];
    for (const ev of events) {
      const changes = await repo.getCharacterChangesByEvent(ev.id);
      const relChanges = await repo.dbManager.all(
        `SELECT * FROM relationship_changes WHERE event_id = ?`,
        [ev.id]
      );
      enriched.push({
        ...ev,
        changes,
        relationshipChanges: relChanges || []
      });
    }
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/canon/events", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { positionKey, title, description, importance, status, changes } = req.body;
    const repo = getCanonRepository();
    const eventId = uuidv4();
    
    const event = {
      id: eventId,
      projectId,
      positionKey,
      title,
      description,
      importance: importance || "major",
      status: status || "confirmed"
    };
    await repo.createCanonEvent(event);
    
    // Save associated character changes
    if (changes && changes.length > 0) {
      for (const ch of changes) {
        await repo.createCharacterChange({
          characterId: ch.characterId,
          eventId: eventId,
          positionKey: positionKey,
          field: ch.field,
          oldValue: ch.oldValue,
          newValue: ch.newValue
        });
      }
    }
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/canon/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const repo = getCanonRepository();
    await repo.updateCanonEvent(eventId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/canon/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const repo = getCanonRepository();
    await repo.deleteCanonEvent(eventId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Character Property Changes
router.post("/canon/characters/changes", async (req, res) => {
  try {
    const repo = getCanonRepository();
    const { characterId, eventId, positionKey, field, oldValue, newValue } = req.body;
    const change = { characterId, eventId, positionKey, field, oldValue, newValue };
    await repo.createCharacterChange(change);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/canon/characters/:charId/state", async (req, res) => {
  try {
    const { charId } = req.params;
    const { positionKey } = req.query;
    const service = getCanonService();
    const state = await service.resolveCharacterStateAt(charId, positionKey);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Relationships Replay
router.get("/canon/relationships/replay", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { positionKey } = req.query;
    const service = getCanonService();
    const replay = await service.replayRelationshipsUpTo(projectId, positionKey);
    res.json(replay);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/canon/relationships/changes", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const repo = getCanonRepository();
    const changes = await repo.getRelationshipChanges(projectId);
    res.json(changes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/canon/relationships/changes", async (req, res) => {
  try {
    const repo = getCanonRepository();
    const { projectId, characterA, characterB, eventId, positionKey, oldRelationship, newRelationship, reason } = req.body;
    const change = { projectId, characterA, characterB, eventId, positionKey, oldRelationship, newRelationship, reason };
    await repo.createRelationshipChange(change);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Continuity Scanner and Reports
router.get("/canon/reports", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const repo = getCanonRepository();
    const list = await repo.getContinuityReports(projectId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/canon/reports/:reportId/resolve", async (req, res) => {
  try {
    const { reportId } = req.params;
    const repo = getCanonRepository();
    await repo.resolveContinuityReport(reportId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/canon/reports/:reportId/status", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, ignoredReason } = req.body; // 'active', 'resolved', 'ignored'
    if (!["active", "resolved", "ignored"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    const repo = getCanonRepository();
    let query = `UPDATE continuity_reports SET status = ?`;
    const params = [status];
    if (status === "resolved") {
      query += `, resolved = 1`;
    } else if (status === "ignored") {
      query += `, ignored_reason = ?`;
      params.push(ignoredReason || null);
    }
    query += ` WHERE id = ?`;
    params.push(reportId);
    await repo.dbManager.run(query, params);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/canon/check-scene", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { sceneId, text } = req.body;
    const service = getCanonService();
    const reports = await service.checkSceneConsistency(projectId, sceneId, text);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Dynamically populates story_entities table if empty (runs on-demand)
function ensureStoryEntitiesPopulated(db, projectId) {
  try {
    const countRow = db.prepare("SELECT COUNT(*) as cnt FROM story_entities WHERE project_id = ?").get(projectId);
    const count = countRow ? countRow.cnt : 0;
    if (count > 0) return;
  } catch (e) {
    // Table doesn't exist or migration hasn't finished loading yet (fail-safe)
    return;
  }

  console.log(`[StoryEntities] Rebuilding entity index for project: ${projectId}`);
  
  // 1. Chapters
  const chapters = db.prepare("SELECT id, title, chapter_number FROM chapters WHERE project_id = ?").all(projectId);
  for (const ch of chapters) {
    db.prepare(`
      INSERT OR IGNORE INTO story_entities (id, project_id, entity_type, name, importance)
      VALUES (?, ?, 'chapter', ?, 50)
    `).run(ch.id, projectId, `Chapter ${ch.chapter_number}: ${ch.title}`);
  }

  // 2. Entities (Characters, Locations, etc.)
  const entities = db.prepare("SELECT id, type, title FROM entities WHERE project_id = ?").all(projectId);
  for (const ent of entities) {
    db.prepare(`
      INSERT OR IGNORE INTO story_entities (id, project_id, entity_type, name, importance)
      VALUES (?, ?, ?, ?, 50)
    `).run(ent.id, projectId, ent.type, ent.title);
  }

  // 3. Threads
  const threads = db.prepare("SELECT id, name, type FROM story_threads WHERE project_id = ?").all(projectId);
  for (const th of threads) {
    db.prepare(`
      INSERT OR IGNORE INTO story_entities (id, project_id, entity_type, name, importance)
      VALUES (?, ?, 'thread', ?, 50)
    `).run(th.id, projectId, th.name);
  }
}

// Helper: Rebuilds graph relationships cache based on current database state
function rebuildGraphCache(db, projectId) {
  try {
    // Clear existing project cache
    db.prepare("DELETE FROM graph_relationships_cache WHERE project_id = ?").run(projectId);

    // 1. Chapters sequence connections (leads_to)
    const chapters = db.prepare("SELECT id, chapter_number FROM chapters WHERE project_id = ? ORDER BY chapter_number ASC").all(projectId);
    for (let i = 0; i < chapters.length - 1; i++) {
      const edgeId = `${chapters[i].id}_to_${chapters[i+1].id}`;
      db.prepare(`
        INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
        VALUES (?, ?, ?, ?, 'leads_to', 80)
      `).run(edgeId, projectId, chapters[i].id, chapters[i+1].id);
    }

    // 2. Character appearances in Chapters (via canon events character changes)
    const events = db.prepare("SELECT id, position_key FROM canon_events WHERE project_id = ?").all(projectId);
    for (const ev of events) {
      if (!ev.position_key) continue;
      const chNumber = parseInt(ev.position_key.split(".")[0], 10);
      if (isNaN(chNumber)) continue;
      const chapter = db.prepare("SELECT id FROM chapters WHERE project_id = ? AND chapter_number = ?").get(projectId, chNumber);
      if (!chapter) continue;

      const changes = db.prepare("SELECT character_id FROM character_changes WHERE event_id = ?").all(ev.id);
      for (const ch of changes) {
        const edgeId = `${ch.character_id}_appears_${chapter.id}`;
        db.prepare(`
          INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
          VALUES (?, ?, ?, ?, 'appears_in', 70)
        `).run(edgeId, projectId, ch.character_id, chapter.id);
      }
    }

    // 3. Relationship Milestones (Character ↔ Character)
    const relChanges = db.prepare("SELECT character_a, character_b, event_id FROM relationship_changes WHERE project_id = ?").all(projectId);
    for (const rc of relChanges) {
      const pairId = rc.character_a < rc.character_b ? `${rc.character_a}_${rc.character_b}` : `${rc.character_b}_${rc.character_a}`;
      const edgeId = `${pairId}_link`;
      db.prepare(`
        INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
        VALUES (?, ?, ?, ?, 'relationship', 90)
      `).run(edgeId, projectId, rc.character_a, rc.character_b);

      const ev = db.prepare("SELECT position_key FROM canon_events WHERE id = ?").get(rc.event_id);
      if (ev && ev.position_key) {
        const chNumber = parseInt(ev.position_key.split(".")[0], 10);
        const chapter = db.prepare("SELECT id FROM chapters WHERE project_id = ? AND chapter_number = ?").get(projectId, chNumber);
        if (chapter) {
          db.prepare(`
            INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
            VALUES (?, ?, ?, ?, 'relationship_change', 75)
          `).run(`${pairId}_in_${chapter.id}_a`, projectId, rc.character_a, chapter.id);
          db.prepare(`
            INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
            VALUES (?, ?, ?, ?, 'relationship_change', 75)
          `).run(`${pairId}_in_${chapter.id}_b`, projectId, rc.character_b, chapter.id);
        }
      }
    }

    // 4. Thread Chapter reveals (Chapter -> Thread)
    const threadChs = db.prepare(`
      SELECT tc.thread_id, tc.chapter_id, st.type 
      FROM thread_chapters tc
      JOIN story_threads st ON tc.thread_id = st.id
      WHERE st.project_id = ?
    `).all(projectId);
    for (const tc of threadChs) {
      const edgeId = `${tc.thread_id}_reveals_${tc.chapter_id}`;
      const edgeType = tc.type === 'mystery' ? 'reveals' : 'mentions';
      db.prepare(`
        INSERT OR IGNORE INTO graph_relationships_cache (id, project_id, source_id, target_id, edge_type, importance)
        VALUES (?, ?, ?, ?, ?, 85)
      `).run(edgeId, projectId, tc.thread_id, tc.chapter_id, edgeType);
    }
  } catch (e) {
    console.error("[GraphCache] Error rebuilding cache:", e);
  }
}

// 5. Get Graph nodes and cached relationships
router.get("/canon/graph/data", async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.query.projectId || "default";
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) {
      return res.json({ nodes: [], edges: [] });
    }

    // Dynamic populate story_entities index & cache if needed
    try {
      ensureStoryEntitiesPopulated(db, projectId);
      const countRow = db.prepare("SELECT COUNT(*) as cnt FROM graph_relationships_cache WHERE project_id = ?").get(projectId);
      const count = countRow ? countRow.cnt : 0;
      if (count === 0) {
        rebuildGraphCache(db, projectId);
      }
    } catch (cacheErr) {
      console.warn("[GraphRoute] Cache populate warning:", cacheErr);
    }

    const nodes = db.prepare("SELECT * FROM story_entities WHERE project_id = ?").all(projectId) || [];
    const edges = db.prepare("SELECT * FROM graph_relationships_cache WHERE project_id = ?").all(projectId) || [];

    res.json({ nodes, edges });
  } catch (error) {
    console.error("[GraphRoute] Error:", error);
    res.json({ nodes: [], edges: [] });
  }
});

// 6. Get Character Arc evolution history
router.get("/canon/characters/:charId/arcs", async (req, res) => {
  try {
    const { charId } = req.params;
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    const arcs = db.prepare(`
      SELECT cae.*, c.chapter_number, c.title as chapter_title, c.act
      FROM character_arc_events cae
      LEFT JOIN chapters c ON cae.chapter_id = c.id
      WHERE cae.character_id = ? AND (c.project_id = ? OR cae.chapter_id IS NULL)
      ORDER BY c.chapter_number ASC, cae.importance DESC
    `).all(charId, projectId);

    res.json(arcs || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Post/Log Character Arc milestone event
router.post("/canon/characters/:charId/arcs", async (req, res) => {
  try {
    const { charId } = req.params;
    const {
      chapterId,
      eventType,
      emotionalState,
      motivation,
      beliefChange,
      relationshipChange,
      importance,
      locationId,
      triggerEvent
    } = req.body;

    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    const id = uuidv4();
    db.prepare(`
      INSERT INTO character_arc_events (
        id, character_id, chapter_id, event_type, emotional_state,
        motivation, belief_change, relationship_change, importance, location_id, trigger_event
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      charId,
      chapterId || null,
      eventType || "",
      emotionalState || "",
      motivation || "",
      beliefChange || "",
      relationshipChange || "",
      importance !== undefined ? Number(importance) : 50,
      locationId || null,
      triggerEvent || ""
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 8. Get user workspace persistence state
router.get("/state", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    const state = db.prepare("SELECT * FROM user_workspace_state WHERE project_id = ?").get(projectId);
    res.json(state || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Post/Save user workspace persistence state
router.post("/state", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const {
      activeTab,
      focusedEntityJson,
      graphZoom,
      graphDepth,
      timelinePositionKey,
      lastViewMode,
      navigationStateJson
    } = req.body;

    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    db.prepare(`
      INSERT INTO user_workspace_state (
        project_id, active_tab, focused_entity_json, graph_zoom, graph_depth, timeline_position_key, last_view_mode, navigation_state_json, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id) DO UPDATE SET
        active_tab = excluded.active_tab,
        focused_entity_json = excluded.focused_entity_json,
        graph_zoom = excluded.graph_zoom,
        graph_depth = excluded.graph_depth,
        timeline_position_key = excluded.timeline_position_key,
        last_view_mode = excluded.last_view_mode,
        navigation_state_json = excluded.navigation_state_json,
        last_updated = CURRENT_TIMESTAMP
    `).run(
      projectId,
      activeTab || "story",
      focusedEntityJson || "[]",
      graphZoom !== undefined ? Number(graphZoom) : 1.0,
      graphDepth !== undefined ? Number(graphDepth) : 1,
      timelinePositionKey || null,
      lastViewMode || "chapters_only",
      navigationStateJson || "[]"
    );

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 10. Recent Activity API
router.get("/activity", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    // Fetch the 5 most recent unique entity interactions
    const activities = db.prepare(`
      SELECT * FROM user_recent_activity 
      WHERE project_id = ?
      GROUP BY entity_id
      ORDER BY timestamp DESC
      LIMIT 5
    `).all(projectId);

    res.json(activities || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/activity", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { entityId, entityType, action } = req.body;
    
    const db = kernel.getContainer().get("databaseManager").activeDb;
    if (!db) throw new Error("Database connection not open");

    const id = uuidv4();
    db.prepare(`
      INSERT INTO user_recent_activity (id, project_id, entity_id, entity_type, action)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, projectId, entityId, entityType, action || "viewed");

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
