const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("DOCX Word Exporter Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const sceneService = container.get("sceneService");
  const exportService = container.get("exportService");
  
  const projectName = `TestProj_Docx_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;
  
  const scene = await sceneService.createScene(projectId, null, "Intro Scene");
  await sceneService.updateScene(scene.id, {
    content: JSON.stringify({
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{ type: "text", text: "Chapter paragraph text." }]
      }]
    })
  });
  
  // Compile Word Doc
  const result = await exportService.exportManuscript(projectId, "docx");
  
  assert.ok(result.success);
  assert.ok(fs.existsSync(result.path), "DOC word document should exist on disk");
  
  const content = fs.readFileSync(result.path, "utf8");
  assert.ok(content.includes("<html"), "DOC output should contain HTML headers");
  assert.ok(content.includes("xmlns:w="), "DOC output should contain Word schema attributes");

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
