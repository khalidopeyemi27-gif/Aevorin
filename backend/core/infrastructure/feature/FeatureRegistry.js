const fs = require("fs");
const path = require("path");

/**
 * FeatureRegistry class.
 * Central manager checking configuration states of locked editions/features.
 */
class FeatureRegistry {
  constructor() {
    this.flags = {};
    this.loadDefaults();
  }

  /**
   * Loads initial feature flags configuration from JSON template.
   */
  loadDefaults() {
    try {
      const configPath = path.join(__dirname, "FeatureFlags.json");
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        this.flags = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error("[FeatureRegistry] Failed to load FeatureFlags.json:", error);
      // Fail-safe defaults
      this.flags = {
        "core.manuscript": true,
        "core.entities": true,
        "studio.analytics": false,
        "intelligence.ai": false,
        "forge.sync": false,
        "developer.mode": false
      };
    }
  }

  /**
   * Checks if a target feature is unlocked and enabled.
   * @param {string} flagName - Flag name.
   * @returns {boolean} True if enabled.
   */
  enabled(flagName) {
    if (this.flags["developer.mode"] === true) {
      return true; // Developer mode bypasses restriction toggles
    }
    return !!this.flags[flagName];
  }

  /**
   * Enables or disables a flag dynamically in memory.
   * @param {string} flagName - Flag identifier.
   * @param {boolean} value - Enabled state.
   */
  setFlag(flagName, value) {
    this.flags[flagName] = !!value;
    console.log(`[FeatureRegistry] Flag changed: ${flagName} = ${this.flags[flagName]}`);
  }

  /**
   * Returns list of flags.
   * @returns {object} Flags map.
   */
  getAllFlags() {
    return { ...this.flags };
  }
}

module.exports = FeatureRegistry;
