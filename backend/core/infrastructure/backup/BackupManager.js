const fs = require("fs");
const path = require("path");

/**
 * BackupManager class.
 * Manages database copies and restore points within portable projects.
 */
class BackupManager {
  constructor(databaseManager, projectManager) {
    this.databaseManager = databaseManager;
    this.projectManager = projectManager;
  }

  /**
   * Generates a database snapshot copy.
   * @param {string} projectId - Active project.
   * @returns {Promise<string>} Path to created backup file.
   */
  async createBackup(projectId) {
    if (projectId !== this.projectManager.activeProjectId) {
      throw new Error("Project is not currently loaded");
    }

    const projectPath = this.projectManager.activeProjectPath;
    const dbPath = path.join(projectPath, "database.sqlite");
    
    if (!fs.existsSync(dbPath)) {
      throw new Error("Database file not found on disk");
    }

    // Format filename timestamp: YYYY-MM-DD_HHmmss
    const dateStr = new Date().toISOString()
      .replace(/T/, "_")
      .replace(/\..+/, "")
      .replace(/:/g, "-");

    const backupFileName = `backup_${dateStr}.sqlite`;
    const backupDir = path.join(projectPath, "backups");
    const backupPath = path.join(backupDir, backupFileName);

    // Perform copy
    fs.copyFileSync(dbPath, backupPath);

    // Rotate backups
    await this.rotateBackups(projectId);

    return backupFileName;
  }

  /**
   * Lists available backup files in project.
   * @param {string} projectId - Active project.
   * @returns {Promise<Array<object>>}
   */
  async listBackups(projectId) {
    if (projectId !== this.projectManager.activeProjectId) {
      throw new Error("Project is not currently loaded");
    }

    const projectPath = this.projectManager.activeProjectPath;
    const backupDir = path.join(projectPath, "backups");

    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir);
    return files
      .filter(f => f.startsWith("backup_") && f.endsWith(".sqlite"))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        const stat = fs.statSync(fullPath);
        return {
          fileName: f,
          created: stat.mtime,
          sizeBytes: stat.size
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime()); // Newest first
  }

  /**
   * Restores database state from a backup file.
   * @param {string} projectId - Active project.
   * @param {string} backupFileName - Name of the file inside backups/.
   * @returns {Promise<void>}
   */
  async restoreBackup(projectId, backupFileName) {
    if (projectId !== this.projectManager.activeProjectId) {
      throw new Error("Project is not currently loaded");
    }

    const projectPath = this.projectManager.activeProjectPath;
    const backupPath = path.join(projectPath, "backups", backupFileName);

    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup file not found");
    }

    const dbPath = path.join(projectPath, "database.sqlite");

    // 1. Close active connections
    await this.databaseManager.closeDatabase();

    // 2. Overwrite database
    fs.copyFileSync(backupPath, dbPath);

    // 3. Re-open connection
    await this.databaseManager.openProjectDatabase(dbPath);
  }

  /**
   * Keeps only the 10 most recent backups.
   * @param {string} projectId - Active project.
   * @param {number} maxKeep - Max threshold.
   */
  async rotateBackups(projectId, maxKeep = 10) {
    const list = await this.listBackups(projectId);
    if (list.length <= maxKeep) return;

    const projectPath = this.projectManager.activeProjectPath;
    const toRemove = list.slice(maxKeep);

    for (const item of toRemove) {
      const filePath = path.join(projectPath, "backups", item.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = BackupManager;
