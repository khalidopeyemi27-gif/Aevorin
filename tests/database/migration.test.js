const test = require("node:test");
const assert = require("node:assert");
const DatabaseManager = require("../../backend/core/infrastructure/database/db");
const EventBus = require("../../backend/core/infrastructure/events/EventBus");

test("Database Schema Migrations Test", async (t) => {
  const eventBus = new EventBus();
  const dbManager = new DatabaseManager(eventBus);
  const testDbFile = ":memory:";
  
  await dbManager.openProjectDatabase(testDbFile);
  await dbManager.runMigrations();

  // Verify tables exist
  const tables = ["project_metadata", "feature_flags", "chapters", "scenes", "entities", "version_history"];
  
  for (const table of tables) {
    const res = await dbManager.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [table]
    );
    assert.ok(res, `Table '${table}' should exist in the migrated database`);
  }

  await dbManager.closeDatabase();
});
