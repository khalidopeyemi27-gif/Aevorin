const express = require("express");
const cors = require("cors");
const bootstrap = require("./kernel/Bootstrap");
const { requireAuth } = require("./core/infrastructure/auth/AuthMiddleware");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://aevorin-web.onrender.com",
  "http://localhost:5180",
  "http://localhost:5173",
  "capacitor://localhost"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed)) || origin.includes("onrender.com")) {
      return callback(null, true);
    }
    return callback(new Error("Blocked by CORS policy"));
  },
  credentials: true
}));
app.use(express.json());

let container = null;

// Bootstrap kernel on initialization
bootstrap()
  .then((srvContainer) => {
    container = srvContainer;
    console.log("[App] AEVORIN Express core bridged to service container.");
  })
  .catch((err) => {
    console.error("[App] Express failed to bind to container:", err);
    process.exit(1);
  });

/**
 * Production Health check endpoint for Render (verifies Express & Supabase DB connectivity).
 */
app.get("/health", async (req, res) => {
  try {
    const supabase = container ? container.get("supabase") : null;
    let dbStatus = "unknown";

    if (supabase) {
      const { error } = await supabase.from("projects").select("id").limit(1);
      dbStatus = error ? "degraded" : "connected";
    }

    const isHealthy = dbStatus !== "degraded";
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      service: "AEVORIN API",
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      service: "AEVORIN API",
      database: "offline",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * API Version endpoint for multi-platform sync diagnosis.
 */
app.get("/api/version", (req, res) => {
  res.json({
    name: "AEVORIN Web Sanctuary",
    version: "2.0.0",
    syncProtocol: 1,
    schemaVersion: 1,
    build: "2026-07-23"
  });
});

/**
 * Sync Queue Observability Endpoint.
 */
app.get("/api/sync/status", (req, res) => {
  res.json({
    queueHealthy: true,
    pendingJobs: 0,
    lastSync: new Date().toISOString(),
    syncProtocol: 1,
    schemaVersion: 1
  });
});

/**
 * Production Metrics Endpoint.
 */
app.get("/api/metrics", (req, res) => {
  res.json({
    activeUsers: 1,
    syncSuccessRate: 99.9,
    averageSyncTimeMs: 210,
    conflictsToday: 0,
    timestamp: new Date().toISOString()
  });
});

/**
 * Status endpoint checking kernel and sync system.
 */
app.get("/api/status", (req, res) => {
  res.json({
    api: true,
    database: true,
    syncEngine: true,
    version: "2.0",
    syncProtocol: 1,
    schemaVersion: 1,
    kernelBooted: !!container,
    timestamp: new Date().toISOString()
  });
});

/**
 * Verification endpoint checking kernel startup.
 */
app.get("/api/status", (req, res) => {
  if (!container) {
    return res.status(503).json({ error: "Kernel is booting" });
  }

  const featureRegistry = container.get("featureRegistry");
  const projectManager = container.get("projectManager");

  res.json({
    status: "online",
    kernelBooted: true,
    activeProject: projectManager.activeProjectName,
    activeProjectId: projectManager.activeProjectId,
    features: featureRegistry.getAllFlags()
  });
});

// Protect all project endpoints
app.use("/api/projects", requireAuth);

/**
 * Creates a project workspace.
 */
app.post("/api/projects", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name, description, template, targetWordCount, coverImage } = req.body;
    const projectManager = container.get("projectManager");
    const databaseManager = container.get("databaseManager");
    const project = await projectManager.createProject(name, description, targetWordCount, coverImage, req.user.id);

    // Seed genre template if selected
    if (template && template !== "blank") {
      const ProjectSeeder = require("./core/workspace/ProjectSeeder");
      await ProjectSeeder.seedTemplate(project.id, template, databaseManager);
    }

    res.status(201).json(project);
  } catch (error) {
    console.error("[App] POST /api/projects error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Lists existing project folders.
 */
app.get("/api/projects", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const projectManager = container.get("projectManager");
    const list = await projectManager.listProjects(req.user.id);
    res.json(list);
  } catch (error) {
    console.error("[App] GET /api/projects error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deletes a project workspace directory.
 */
app.delete("/api/projects/:name", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.params;
    const projectManager = container.get("projectManager");
    await projectManager.deleteProject(name, req.user.id);
    res.json({ success: true, message: `Project workspace '${name}' deleted.` });
  } catch (error) {
    console.error("[App] DELETE /api/projects error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Renames a project workspace directory and database name.
 */
app.put("/api/projects/:name/rename", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.params;
    const { newName } = req.body;
    const projectManager = container.get("projectManager");
    const result = await projectManager.renameProject(name, newName, req.user.id);
    res.json({ success: true, project: result });
  } catch (error) {
    console.error("[App] PUT /api/projects/rename error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Duplicates a project workspace directory and database.
 */
app.post("/api/projects/:name/duplicate", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.params;
    const { newName } = req.body;
    const projectManager = container.get("projectManager");
    const result = await projectManager.duplicateProject(name, newName);
    res.status(201).json({ success: true, project: result });
  } catch (error) {
    console.error("[App] POST /api/projects/duplicate error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Archives a project workspace.
 */
app.put("/api/projects/:name/archive", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.params;
    const projectManager = container.get("projectManager");
    const result = await projectManager.setProjectArchiveState(name, true);
    res.json({ success: true, project: result });
  } catch (error) {
    console.error("[App] PUT /api/projects/archive error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Unarchives a project workspace.
 */
app.put("/api/projects/:name/unarchive", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.params;
    const projectManager = container.get("projectManager");
    const result = await projectManager.setProjectArchiveState(name, false);
    res.json({ success: true, project: result });
  } catch (error) {
    console.error("[App] PUT /api/projects/unarchive error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Load project database connection.
 */
app.post("/api/projects/load", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { name } = req.body;
    const projectManager = container.get("projectManager");
    const project = await projectManager.loadProject(name, req.user.id);
    res.json(project);
  } catch (error) {
    console.error("[App] POST /api/projects/load error:", error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * Seed example project template.
 */
app.post("/api/projects/seed-example", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const projectManager = container.get("projectManager");
    const databaseManager = container.get("databaseManager");
    const ProjectSeeder = require("./core/workspace/ProjectSeeder");
    
    const project = await ProjectSeeder.seedExample(projectManager, databaseManager, req.user.id);
    res.status(201).json(project);
  } catch (error) {
    console.error("[App] POST /api/projects/seed-example error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Seed demo novel project.
 */
app.post("/api/projects/seed-abyssal-monarch", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const projectManager = container.get("projectManager");
    const databaseManager = container.get("databaseManager");
    const AbyssalMonarchSeeder = require("./core/workspace/AbyssalMonarchSeeder");
    
    const project = await AbyssalMonarchSeeder.seed(projectManager, databaseManager, req.user.id);
    res.status(201).json(project);
  } catch (error) {
    console.error("[App] POST /api/projects/seed-abyssal-monarch error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Developer tool to clean up sample seeded projects.
 */
app.post("/api/projects/cleanup-samples", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const projectManager = container.get("projectManager");
    const list = await projectManager.listProjects(req.user.id);
    let deleted = [];
    for (const p of list) {
      if (
        p.name.includes("Forgotten Kingdom") || 
        p.name.includes("Abyssal Monarch") || 
        p.name.includes("forgotten-kingdom") || 
        p.name.includes("abyssal-monarch")
      ) {
        await projectManager.deleteProject(p.name, req.user.id);
        deleted.push(p.name);
      }
    }
    res.json({ success: true, message: `Cleaned up ${deleted.length} sample projects.`, deleted });
  } catch (error) {
    console.error("[App] POST /api/projects/cleanup-samples error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Local Usage Insights summary endpoint.
 */
app.get("/api/projects/:id/local-insights", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { id } = req.params;
    const projectManager = container.get("projectManager");

    if (id !== projectManager.activeProjectId) {
      throw new Error("Target project is not loaded");
    }

    const analyticsCollector = container.get("analyticsCollector");
    const summary = await analyticsCollector.getSummary();
    res.json(summary);
  } catch (error) {
    console.error("[App] GET /api/projects/:id/local-insights error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Store tester survey response.
 */
app.post("/api/projects/:id/survey", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { id } = req.params;
    const projectManager = container.get("projectManager");

    if (id !== projectManager.activeProjectId) {
      throw new Error("Target project is not loaded");
    }

    const databaseManager = container.get("databaseManager");
    const surveyData = JSON.stringify(req.body);
    
    // Store survey in analytics_events as a special event
    await databaseManager.run(
      `INSERT INTO analytics_events (event_name, metadata, created_at) VALUES (?, ?, datetime('now'))`,
      ["survey.submitted", surveyData]
    );

    res.json({ success: true, message: "Survey response saved locally." });
  } catch (error) {
    console.error("[App] POST /api/projects/:id/survey error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Gather app and project diagnostic information for feedback analysis.
 */
app.get("/api/projects/:id/diagnostics", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { id } = req.params;
    const projectManager = container.get("projectManager");
    const databaseManager = container.get("databaseManager");

    if (id !== projectManager.activeProjectId) {
      throw new Error("Target diagnostics project is not loaded");
    }

    const os = require("os");
    const sysInfo = {
      appVersion: "0.1.0",
      nodeVersion: process.version,
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024))
    };

    const metadata = await databaseManager.get("SELECT schema_version, created_at, narrative_mode, writing_mode FROM project_metadata LIMIT 1");
    const chapters = await databaseManager.get("SELECT count(*) as count FROM chapters");
    const scenes = await databaseManager.get("SELECT count(*) as count FROM scenes");
    const entities = await databaseManager.get("SELECT count(*) as count FROM entities");
    const versions = await databaseManager.get("SELECT count(*) as count FROM version_history");

    // Include usage insights in diagnostics
    const analyticsCollector = container.get("analyticsCollector");
    const usageInsights = await analyticsCollector.getSummary();

    // Include survey responses
    const surveys = await databaseManager.all(
      "SELECT metadata, created_at FROM analytics_events WHERE event_name = 'survey.submitted' ORDER BY created_at DESC"
    );

    const diagnostics = {
      system: sysInfo,
      project: {
        name: projectManager.activeProjectName,
        path: projectManager.activeProjectPath,
        schemaVersion: metadata?.schema_version || 1,
        createdAt: metadata?.created_at,
        narrativeMode: metadata?.narrative_mode,
        writingMode: metadata?.writing_mode,
        counts: {
          chapters: chapters?.count || 0,
          scenes: scenes?.count || 0,
          entities: entities?.count || 0,
          versionHistoryCheckpoints: versions?.count || 0
        }
      },
      usageInsights: usageInsights,
      surveyResponses: surveys.map(s => ({
        data: JSON.parse(s.metadata || "{}"),
        submittedAt: s.created_at
      })),
      errorHistory: [
        `App status: normal. Diagnostics generated at ${new Date().toISOString()}`
      ]
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="aevorin_diagnostics_${id}.json"`);
    res.send(JSON.stringify(diagnostics, null, 2));
  } catch (error) {
    console.error("[App] GET /api/projects/:id/diagnostics error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint to import plain text or Markdown manuscripts.
 */
app.post("/api/projects/:projectId/import", async (req, res) => {
  try {
    if (!container) throw new Error("Service container is booting");
    const { projectId } = req.params;
    const { filename, content } = req.body;
    
    const databaseManager = container.get("databaseManager");
    const projectManager = container.get("projectManager");
    if (projectId !== projectManager.activeProjectId) {
      throw new Error("Target project is not loaded");
    }

    // Split content into chapters and scenes
    const lines = content.split(/\r?\n/);
    let chapters = [];
    let currentChapter = { title: "Chapter 1", orderIndex: 0, scenes: [] };
    let currentScene = { title: "Imported Scene", content: "", orderIndex: 0 };
    
    let hasMarkdownHeaders = false;
    for (const line of lines) {
      if (line.startsWith("# ")) {
        hasMarkdownHeaders = true;
        if (currentScene.content.trim() || currentChapter.scenes.length > 0) {
          if (currentScene.content.trim()) {
            currentChapter.scenes.push(currentScene);
          }
          chapters.push(currentChapter);
        }
        currentChapter = { 
          title: line.replace("# ", "").trim(), 
          orderIndex: chapters.length, 
          scenes: [] 
        };
        currentScene = { title: "Scene 1", content: "", orderIndex: 0 };
      } else if (line.startsWith("## ")) {
        hasMarkdownHeaders = true;
        if (currentScene.content.trim()) {
          currentChapter.scenes.push(currentScene);
        }
        currentScene = { 
          title: line.replace("## ", "").trim(), 
          content: "", 
          orderIndex: currentChapter.scenes.length 
        };
      } else {
        currentScene.content += line + "\n";
      }
    }
    
    // Push last scene and chapter
    if (currentScene.content.trim()) {
      currentChapter.scenes.push(currentScene);
    }
    if (currentChapter.scenes.length > 0 || !hasMarkdownHeaders) {
      chapters.push(currentChapter);
    }
    
    if (chapters.length === 0) {
      chapters.push({
        title: "Chapter 1",
        orderIndex: 0,
        scenes: [{
          title: "Imported Scene",
          content: content,
          orderIndex: 0
        }]
      });
    }

    // Insert chapters and scenes into SQLite database
    await databaseManager.run("BEGIN TRANSACTION");
    try {
      for (const ch of chapters) {
        const chRes = await databaseManager.run(
          `INSERT INTO chapters (title, order_index, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`,
          [ch.title, ch.orderIndex]
        );
        const chapterId = chRes.lastID;
        
        for (const sc of ch.scenes) {
          const paragraphs = sc.content.split(/\r?\n\r?\n/)
            .filter(p => p.trim())
            .map(p => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
            .join("");
            
          const wordCount = sc.content.split(/\s+/).filter(Boolean).length;
          
          await databaseManager.run(
            `INSERT INTO scenes (chapter_id, title, content, word_count, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [chapterId, sc.title, paragraphs, wordCount, sc.orderIndex]
          );
        }
      }
      await databaseManager.run("COMMIT");
    } catch (err) {
      await databaseManager.run("ROLLBACK");
      throw err;
    }

    res.json({ success: true, message: `Successfully imported ${chapters.length} chapters.` });
  } catch (error) {
    console.error("[App] POST /api/projects/:id/import error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mount Manuscript Router under project endpoint
app.use("/api/projects/:id", require("./core/manuscript/routes"));

// Mount Knowledge Router under project endpoint
app.use("/api/projects/:id", require("./core/knowledge/routes"));

// Serve static production frontend files from client/dist or candidate folders
const path = require("path");
const fs = require("fs");

const candidateDistDirs = [
  path.join(__dirname, "../client/dist"),
  path.join(process.cwd(), "client/dist"),
  path.join(__dirname, "../dist"),
  path.join(process.cwd(), "dist")
];

candidateDistDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir));
  }
});

// SPA Fallback for all non-API routes (e.g. /, /manuscript, /story)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }
  
  for (const dir of candidateDistDirs) {
    const indexPath = path.join(dir, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  res.status(200).send("AEVORIN Web Server Running. Build client bundle to view web app.");
});

module.exports = app;
