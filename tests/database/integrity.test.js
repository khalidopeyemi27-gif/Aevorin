const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const kernel = require("../../backend/kernel/ApplicationKernel");
const ProjectValidator = require("../../backend/core/workspace/ProjectValidator");

test("Project Integrity Validator Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const dbManager = container.get("databaseManager");
  
  const projectName = `TestProj_Val_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectPath = project.path;
  
  // 1. Valid project should pass
  const res1 = await ProjectValidator.validate(projectPath, dbManager);
  assert.ok(res1.valid, "Valid project should pass validation checks");
  assert.strictEqual(res1.errors.length, 0);
  
  // 2. Corrupt manifest
  const manifestFile = path.join(projectPath, "project.aevorin");
  fs.writeFileSync(manifestFile, "not valid json {", "utf8");
  const res2 = await ProjectValidator.validate(projectPath, dbManager);
  assert.strictEqual(res2.valid, false, "Corrupted JSON manifest should fail validation");
  
  // Restore manifest
  fs.writeFileSync(manifestFile, JSON.stringify(project.manifest), "utf8");
  
  // 3. Missing database file
  const dbFile = path.join(projectPath, "database.sqlite");
  
  // Close DB connection before deleting file
  await dbManager.closeDatabase();
  
  fs.renameSync(dbFile, dbFile + ".bak");
  
  const res3 = await ProjectValidator.validate(projectPath, dbManager);
  assert.strictEqual(res3.valid, false, "Missing database.sqlite file should fail validation");
  
  // Restore database file
  fs.renameSync(dbFile + ".bak", dbFile);
  await dbManager.openProjectDatabase(dbFile);

  // 4. Missing assets folder
  const assetsDir = path.join(projectPath, "assets");
  fs.rmdirSync(assetsDir);
  const res4 = await ProjectValidator.validate(projectPath, dbManager);
  assert.strictEqual(res4.valid, false, "Missing assets folder should fail validation");

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
