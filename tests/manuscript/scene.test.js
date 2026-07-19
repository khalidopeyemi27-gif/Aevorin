const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("Scene Service CRUD Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const sceneService = container.get("sceneService");
  
  // 1. Create unique test project
  const projectName = `TestProj_Sc_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;
  
  // Clear seeded defaults
  const existing = await sceneService.getScenes(projectId);
  for (const sc of existing) {
    await sceneService.deleteScene(sc.id);
  }
  
  // 2. Create Scene
  const scene = await sceneService.createScene(projectId, null, "Scene 1: Starlit Voyage");
  assert.ok(scene.id, "Created scene should have an ID");
  assert.strictEqual(scene.title, "Scene 1: Starlit Voyage");
  
  // 3. Update Scene content & metadata (Write text)
  const contentDoc = {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{ type: "text", text: "The stars burned silently overhead." }]
    }]
  };
  
  const updated = await sceneService.updateScene(scene.id, {
    content: JSON.stringify(contentDoc),
    wordCount: 5,
    status: "polished"
  });
  
  assert.strictEqual(updated.word_count, 5, "Word count should immediately sync in response");
  assert.strictEqual(updated.status, "polished");
  
  // 4. Delete Scene
  await sceneService.deleteScene(scene.id);
  const list = await sceneService.getScenes(projectId);
  assert.strictEqual(list.length, 0);

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
