const { v4: uuidv4 } = require("uuid");
const EventTypes = require("../infrastructure/events/EventTypes");
const fs = require("fs");
const path = require("path");

/**
 * ProjectManager class.
 * Manages workspaces in PostgreSQL.
 */
class ProjectManager {
  constructor(databaseManager, eventBus) {
    this.databaseManager = databaseManager;
    this.eventBus = eventBus;
    this.activeProjectId = null;
    this.activeProjectName = null;
    this.activeProjectPath = null; // Kept for backwards compatibility with assets

    // Set base path for legacy file assets
    this.baseProjectsPath = path.join(__dirname, "../../../user_data/projects");
  }

  /**
   * Scans Postgres database for valid workspaces.
   */
  async listProjects(ownerId) {
    try {
      await this.databaseManager.openProjectDatabase(); // Ensure connection
      const projects = await this.databaseManager.all(
        `SELECT * FROM project_metadata WHERE owner_id = $1 ORDER BY updated_at DESC`,
        [ownerId]
      );
      
      return projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        targetWordCount: p.target_word_count,
        coverImage: p.cover_image,
        isValid: true,
        errors: []
      }));
    } catch (error) {
      console.error("[ProjectManager] Error scanning projects:", error);
      return [];
    }
  }

  /**
   * Creates a project in Postgres.
   */
  async createProject(name, description = "", targetWordCount = 80000, coverImage = null, ownerId = null) {
    if (!name || name.trim() === "") throw new Error("Project name is required.");
    if (!ownerId) throw new Error("ownerId is required.");

    await this.databaseManager.openProjectDatabase();
    
    // Check if name exists for this user
    const existing = await this.databaseManager.get(
      "SELECT id FROM project_metadata WHERE name = $1 AND owner_id = $2", 
      [name, ownerId]
    );
    if (existing) throw new Error(`Project '${name}' already exists.`);

    const projectId = uuidv4();
    
    // Create folders for local file assets (exports/images) if running locally
    const safeName = name.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    const projectDir = path.join(this.baseProjectsPath, safeName);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "exports"), { recursive: true });
    }

    // Save project_metadata
    await this.databaseManager.run(
      `INSERT INTO project_metadata (id, owner_id, name, description, target_word_count, cover_image) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, ownerId, name, description, targetWordCount, coverImage]
    );

    // Auto-create default Chapter 1 and Scene 1 structure
    const chapterId = uuidv4();
    await this.databaseManager.run(
      `INSERT INTO chapters (id, project_id, title, order_index) VALUES ($1, $2, $3, $4)`,
      [chapterId, projectId, "Chapter 1: The Beginning", 0]
    );

    const sceneId = uuidv4();
    const defaultContent = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
    await this.databaseManager.run(
      `INSERT INTO scenes (id, project_id, chapter_id, title, content_json, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sceneId, projectId, chapterId, "Scene 1: Opening Beat", defaultContent, 0]
    );

    this.activeProjectId = projectId;
    this.activeProjectName = name;
    this.activeProjectPath = projectDir;

    this.eventBus.publish(EventTypes.PROJECT_CREATED, {
      id: projectId,
      name: name,
      path: projectDir
    });

    return { id: projectId, name, path: projectDir };
  }

  /**
   * Loads project and sets it as active in the session.
   */
  async loadProject(idOrName, ownerId) {
    await this.databaseManager.openProjectDatabase();
    
    // Can load by ID or Name
    const metadata = await this.databaseManager.get(
      "SELECT * FROM project_metadata WHERE (id = $1 OR name = $2) AND owner_id = $3 LIMIT 1",
      [idOrName, idOrName, ownerId]
    );

    if (!metadata) {
      throw new Error(`Project '${idOrName}' not found in database.`);
    }

    const safeName = metadata.name.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    const projectDir = path.join(this.baseProjectsPath, safeName);

    this.activeProjectId = metadata.id;
    this.activeProjectName = metadata.name;
    this.activeProjectPath = projectDir;

    this.eventBus.publish(EventTypes.PROJECT_LOADED, {
      id: metadata.id,
      name: metadata.name,
      path: projectDir
    });

    return {
      id: metadata.id,
      name: metadata.name,
      path: projectDir,
      targetWordCount: metadata.target_word_count,
      coverImage: metadata.cover_image,
      description: metadata.description
    };
  }

  /**
   * Deletes a project from the database.
   */
  async deleteProject(idOrName, ownerId) {
    if (!idOrName) throw new Error("Project ID or name is required.");
    await this.databaseManager.openProjectDatabase();

    const metadata = await this.databaseManager.get(
      "SELECT id, name FROM project_metadata WHERE (id = $1 OR name = $2) AND owner_id = $3", 
      [idOrName, idOrName, ownerId]
    );
    
    if (!metadata) throw new Error(`Project not found.`);

    if (this.activeProjectId === metadata.id) {
      this.activeProjectId = null;
      this.activeProjectName = null;
      this.activeProjectPath = null;
    }

    await this.databaseManager.run("DELETE FROM project_metadata WHERE id = $1", [metadata.id]);

    // Optional cleanup of local files
    const safeName = metadata.name.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    const projectDir = path.join(this.baseProjectsPath, safeName);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    return true;
  }

  async renameProject(name, newName, ownerId) {
    await this.databaseManager.openProjectDatabase();
    await this.databaseManager.run(
      "UPDATE project_metadata SET name = $1 WHERE name = $2 AND owner_id = $3", 
      [newName, name, ownerId]
    );
    return { name: newName };
  }

  async duplicateProject(name, newName) {
    // Not fully implemented for deep duplication across all PG tables right now.
    // For a real production system, this would involve a deep copy transaction.
    throw new Error("Duplicate not supported in Postgres mode yet.");
  }

  async updateProjectStats(name) {
    // Kept as no-op or simple update to updated_at. Postgres triggers or views can handle counts.
    await this.databaseManager.run("UPDATE project_metadata SET updated_at = CURRENT_TIMESTAMP WHERE name = $1", [name]);
  }
}

module.exports = ProjectManager;
