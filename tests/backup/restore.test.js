const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("Backup Snapshot & Restore Point Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const backupManager = container.get("backupManager");
  const chapterService = container.get("chapterService");
  
  const projectName = `TestProj_Restore_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;
  
  // Clear seeded defaults
  const existing = await chapterService.getChapters(projectId);
  for (const ch of existing) {
    await chapterService.deleteChapter(ch.id);
  }
  
  // 1. Create initial chapter
  await chapterService.createChapter(projectId, "First Chapter");
  
  // 2. Take database backup snapshot
  const backupFileName = await backupManager.createBackup(projectId);
  assert.ok(backupFileName.startsWith("backup_"), "Backup file name should match naming format");
  
  // 3. Write modifications (add Second Chapter)
  await chapterService.createChapter(projectId, "Second Chapter");
  const listBefore = await chapterService.getChapters(projectId);
  assert.strictEqual(listBefore.length, 2, "Should have 2 chapters in the draft");
  
  // 4. Trigger database restore point
  await backupManager.restoreBackup(projectId, backupFileName);
  
  // 5. Verify database connection re-established and state restored
  const listAfter = await chapterService.getChapters(projectId);
  assert.strictEqual(listAfter.length, 1, "Should restore state to having only 1 chapter");
  assert.strictEqual(listAfter[0].title, "First Chapter");

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
