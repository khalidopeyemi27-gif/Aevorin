const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const kernel = require("../../backend/kernel/ApplicationKernel");

test("AEVORIN Memory Engine Service & Repository Integration Test", async (t) => {
  await kernel.boot();
  
  const container = kernel.getContainer();
  const projectManager = container.get("projectManager");
  const entityRepository = container.get("entityRepository");
  const sceneRepository = container.get("sceneRepository");
  const canonRepository = container.get("canonRepository");
  const canonService = container.get("canonService");
  
  // 1. Create unique test project
  const projectName = `TestProj_Memory_${Date.now()}`;
  const project = await projectManager.createProject(projectName);
  const projectId = project.id;
  
  // Create test character profile entity
  const charId = "char_arin_id";
  await entityRepository.create({
    id: charId,
    projectId,
    type: "character",
    title: "Arin",
    summary: "Protagonist of the story",
    metadata: {}
  });

  // 2. Log Canon Event 1 at Position '001.001'
  const event1Id = "event_1_id";
  await canonRepository.createCanonEvent({
    id: event1Id,
    projectId,
    positionKey: "001.001",
    title: "Prologue Battle",
    description: "Arin loses his left arm in combat",
    importance: "major",
    status: "confirmed"
  });

  // Log character change consequence with WRONG positionKey supplied - should sync from event!
  await canonRepository.createCharacterChange({
    characterId: charId,
    eventId: event1Id,
    positionKey: "999.999", // should sync/overwrite with 001.001
    field: "left_arm",
    oldValue: "healthy",
    newValue: "lost"
  });

  // 3. Resolve active state at position '001.002'
  const resolvedState1 = await canonService.resolveCharacterStateAt(charId, "001.002");
  assert.strictEqual(resolvedState1.left_arm, "lost", "Arin should have lost left arm resolved at '001.002' due to event sync");

  // 4. Log Canon Event 2 at Position '002.001' (Speculative draft event)
  const event2Id = "event_2_id";
  await canonRepository.createCanonEvent({
    id: event2Id,
    projectId,
    positionKey: "002.001",
    title: "speculative draft event",
    description: "speculative future details",
    importance: "minor",
    status: "draft"
  });

  await canonRepository.createCharacterChange({
    characterId: charId,
    eventId: event2Id,
    positionKey: "002.001",
    field: "blind",
    oldValue: "false",
    newValue: "true"
  });

  // 5. Test Continuity Warnings scanner
  // Create a mock chapter first
  const chapterId = "chapter_test_id";
  const chapterRepository = container.get("chapterRepository");
  await chapterRepository.create({
    id: chapterId,
    projectId,
    title: "Chapter 2",
    order_index: 2
  });

  // Create a mock scene in chapter 2
  const sceneId = "scene_test_id";
  await sceneRepository.create({
    id: sceneId,
    projectId,
    chapterId,
    title: "Chapter 2 Scene 1",
    content: "{}",
    order_index: 1,
    status: "draft",
    word_count: 50
  });

  // Sentence triggers left arm contradiction check
  const contradictionText = "Arin grabbed the ledge with his left hand.";
  const reports = await canonService.checkSceneConsistency(projectId, sceneId, contradictionText);
  
  assert.strictEqual(reports.length, 1, "Should find 1 continuity error (left arm contradiction)");
  assert.strictEqual(reports[0].severity, "critical");
  assert.strictEqual(reports[0].confidence, 0.98, "Left arm contradiction confidence score must be 0.98");
  assert.strictEqual(reports[0].affectedEntityId, charId, "Must link charId as affectedEntityId");

  // Verify warnings are saved to continuity_reports table
  const savedReports = await canonRepository.getContinuityReports(projectId);
  assert.strictEqual(savedReports.length, 1);
  assert.strictEqual(savedReports[0].affected_character, "Arin");
  assert.strictEqual(savedReports[0].status, "active");

  // Mark report as ignored with an ignore reason
  const reportId = savedReports[0].id;
  await canonRepository.dbManager.run(
    `UPDATE continuity_reports SET status = 'ignored', ignored_reason = ? WHERE id = ?`,
    ["flashback story moment", reportId]
  );

  // Active reports query should now omit ignored report
  const activeReportsAfterIgnore = await canonRepository.getContinuityReports(projectId);
  assert.strictEqual(activeReportsAfterIgnore.length, 0, "Ignored warnings should not return in active listings");

  // Verify directly in DB
  const rawReport = await canonRepository.dbManager.get(
    `SELECT status, ignored_reason FROM continuity_reports WHERE id = ?`,
    [reportId]
  );
  assert.strictEqual(rawReport.status, "ignored");
  assert.strictEqual(rawReport.ignored_reason, "flashback story moment");

  // 6. Test Relationship Milestones Transitions
  const charBId = "char_kael_id";
  await entityRepository.create({
    id: charBId,
    projectId,
    type: "character",
    title: "Kael",
    summary: "Rival of Arin",
    metadata: {}
  });

  await canonRepository.createRelationshipChange({
    projectId,
    characterA: charId,
    characterB: charBId,
    eventId: event1Id,
    positionKey: "999.999", // should sync/overwrite with 001.001
    oldRelationship: "allies",
    newRelationship: "rivals",
    reason: "Kael betrayed Arin during the prologue siege"
  });

  const activeRels = await canonService.replayRelationshipsUpTo(projectId, "001.002");
  assert.strictEqual(activeRels.length, 1, "Should resolve 1 active relationship pair");
  assert.strictEqual(activeRels[0].newRelationship, "rivals");

  // Cleanup project folder
  await kernel.shutdown();
  if (fs.existsSync(project.path)) {
    fs.rmSync(project.path, { recursive: true, force: true });
  }
});
