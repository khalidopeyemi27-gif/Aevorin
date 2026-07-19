const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("Chapter Service CRUD Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const chapterService = container.get("chapterService");
  
  // 1. Create unique test project
  const projectName = `TestProj_Ch_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;

  // Clear seeded defaults
  const existing = await chapterService.getChapters(projectId);
  for (const ch of existing) {
    await chapterService.deleteChapter(ch.id);
  }
  
  // 2. Create Chapter
  const chapter = await chapterService.createChapter(projectId, "Intro Chapter");
  assert.ok(chapter.id, "Created chapter should have an ID");
  assert.strictEqual(chapter.title, "Intro Chapter");
  
  // 3. Rename Chapter
  const renamed = await chapterService.renameChapter(chapter.id, "Act 1: Outbreak");
  assert.strictEqual(renamed.title, "Act 1: Outbreak");
  
  // 4. List Chapters
  const list = await chapterService.getChapters(projectId);
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].title, "Act 1: Outbreak");
  
  // 5. Delete Chapter
  await chapterService.deleteChapter(chapter.id);
  const emptyList = await chapterService.getChapters(projectId);
  assert.strictEqual(emptyList.length, 0);

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
