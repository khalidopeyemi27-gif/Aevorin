const test = require("node:test");
const assert = require("node:assert");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("Kernel Bootstrap Test", async (t) => {
  // Boot the kernel
  await kernel.boot();
  
  const container = kernel.getContainer();
  
  assert.ok(kernel.isBooted, "Kernel should be booted successfully");
  assert.ok(container.get("eventBus"), "EventBus service should be registered");
  assert.ok(container.get("featureRegistry"), "FeatureRegistry service should be registered");
  assert.ok(container.get("databaseManager"), "DatabaseManager service should be registered");
  assert.ok(container.get("projectManager"), "ProjectManager service should be registered");
  
  // Cleanup connections
  await kernel.shutdown();
});
