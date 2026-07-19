const fs = require("fs");
const path = require("path");

/**
 * ProjectValidator class.
 * Validates integrity of AEVORIN portable project directories.
 */
class ProjectValidator {
  /**
   * Validates a project folder path.
   * @param {string} projectDir - Path to project.
   * @param {object} databaseManager - DatabaseManager instance (optional, for DB connection validation).
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  static async validate(projectDir, databaseManager = null) {
    const errors = [];

    // 1. Check folder exists
    if (!fs.existsSync(projectDir)) {
      return { valid: false, errors: ["Project directory does not exist."] };
    }

    // 2. Check manifest exists and is valid JSON
    const manifestPath = path.join(projectDir, "project.aevorin");
    if (!fs.existsSync(manifestPath)) {
      errors.push("Missing manifest file: project.aevorin");
    } else {
      try {
        const content = fs.readFileSync(manifestPath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed.format !== "aevorin") {
          errors.push("Invalid project format in manifest.");
        }
      } catch (e) {
        errors.push(`Manifest project.aevorin is corrupted: ${e.message}`);
      }
    }

    // 3. Check SQLite database exists
    const dbPath = path.join(projectDir, "database.sqlite");
    if (!fs.existsSync(dbPath)) {
      errors.push("Missing SQLite database: database.sqlite");
    } else if (databaseManager) {
      // 4. Validate schema and migration version compatibility
      try {
        // Temporarily open the project DB if not already open
        const originalActiveDbPath = databaseManager.activeDbPath;
        
        let needsClosing = false;
        if (originalActiveDbPath !== dbPath) {
          await databaseManager.openProjectDatabase(dbPath);
          needsClosing = true;
        }

        const metadata = await databaseManager.get("SELECT schema_version, id FROM project_metadata LIMIT 1");
        if (!metadata) {
          errors.push("Project database is missing project_metadata records.");
        } else {
          const version = Number(metadata.schema_version);
          if (isNaN(version) || version <= 0) {
            errors.push("Invalid database schema version.");
          }
        }

        if (needsClosing) {
          await databaseManager.closeDatabase();
          if (originalActiveDbPath) {
            await databaseManager.openProjectDatabase(originalActiveDbPath);
          }
        }
      } catch (e) {
        errors.push(`Database connection or schema validation failed: ${e.message}`);
      }
    }

    // 5. Check assets folder exists and is readable
    const assetsPath = path.join(projectDir, "assets");
    if (!fs.existsSync(assetsPath)) {
      errors.push("Missing assets directory folder.");
    } else {
      try {
        fs.accessSync(assetsPath, fs.constants.R_OK);
      } catch (e) {
        errors.push("Assets directory is not readable.");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ProjectValidator;
