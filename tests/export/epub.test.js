const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("EPUB Compilation Exporter Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const sceneService = container.get("sceneService");
  const exportService = container.get("exportService");
  
  const projectName = `TestProj_Epub_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;
  
  // Create test scene
  const scene = await sceneService.createScene(projectId, null, "Intro Scene");
  const contentDoc = {
    type: "doc",
    content: [{
      type: "paragraph",
      content: [{ type: "text", text: "The quick brown fox jumps over the lazy dog." }]
    }]
  };
  await sceneService.updateScene(scene.id, {
    content: JSON.stringify(contentDoc)
  });
  
  // Compile to EPUB
  const result = await exportService.exportManuscript(projectId, "epub");
  
  assert.ok(result.success, "Compilation task should report success");
  assert.ok(fs.existsSync(result.path), "Compiled EPUB directory should exist on disk");
  
  // Check required EPUB eBook container components
  assert.ok(fs.existsSync(path.join(result.path, "mimetype")), "mimetype signature should exist");
  assert.ok(fs.existsSync(path.join(result.path, "META-INF", "container.xml")), "container XML map should exist");
  assert.ok(fs.existsSync(path.join(result.path, "OEBPS", "content.opf")), "content manifest OPF should exist");
  assert.ok(fs.existsSync(path.join(result.path, "OEBPS", "toc.ncx")), "TOC NCX file should exist");
  assert.ok(fs.existsSync(path.join(result.path, "OEBPS", "chapters", "scene_1.xhtml")), "Scene XHTML pages should exist");

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
