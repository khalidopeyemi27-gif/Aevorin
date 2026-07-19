import type { Chapter, ChapterContext, StoryDNA, StoryThread, ChapterLink, ChapterVersion, StorySnapshot, StoryPulseReport } from "../models/chapter";

export async function fetchChapters(projectId: string): Promise<Chapter[]> {
  const res = await fetch(`/api/projects/${projectId}/chapters`);
  if (!res.ok) throw new Error("Failed to fetch chapters");
  return res.json();
}

export async function createChapter(projectId: string, title: string, act: string, purpose: string, status: string): Promise<Chapter> {
  const res = await fetch(`/api/projects/${projectId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, act, purpose, status })
  });
  if (!res.ok) throw new Error("Failed to create chapter");
  return res.json();
}

export async function updateChapter(projectId: string, chapterId: string, updates: Partial<Chapter> & { change_reason?: string, source?: string }): Promise<Chapter> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to update chapter");
  return res.json();
}

export async function deleteChapter(projectId: string, chapterId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete chapter");
}

export async function reorderChapters(projectId: string, chapters: { id: string; order_index: number; act_index: number; act: string }[]): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/chapters/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapters })
  });
  if (!res.ok) throw new Error("Failed to reorder chapters");
}

export async function fetchChapterContext(projectId: string, chapterId: string): Promise<ChapterContext> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/context`);
  if (!res.ok) throw new Error("Failed to fetch chapter details");
  return res.json();
}

// 1. Story DNA API
export async function fetchStoryDNA(projectId: string): Promise<StoryDNA> {
  const res = await fetch(`/api/projects/${projectId}/story-dna`);
  if (!res.ok) throw new Error("Failed to fetch story DNA");
  return res.json();
}

export async function saveStoryDNA(projectId: string, updates: Partial<StoryDNA>): Promise<StoryDNA> {
  const res = await fetch(`/api/projects/${projectId}/story-dna`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to save story DNA");
  return res.json();
}

// 2. Story Threads API
export async function fetchStoryThreads(projectId: string): Promise<StoryThread[]> {
  const res = await fetch(`/api/projects/${projectId}/story-threads`);
  if (!res.ok) throw new Error("Failed to fetch story threads");
  return res.json();
}

export async function createStoryThread(projectId: string, name: string, type: string, description: string, created_chapter: string): Promise<StoryThread> {
  const res = await fetch(`/api/projects/${projectId}/story-threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, description, created_chapter })
  });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function deleteStoryThread(projectId: string, threadId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/story-threads/${threadId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export async function mapThreadToChapter(projectId: string, threadId: string, chapterId: string, role: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/story-threads/${threadId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapterId, role })
  });
  if (!res.ok) throw new Error("Failed to map thread to chapter");
}

export async function unmapThreadFromChapter(projectId: string, threadId: string, chapterId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/story-threads/${threadId}/chapters/${chapterId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to unmap thread from chapter");
}

// 3. Chapter Links API
export async function fetchChapterLinks(projectId: string): Promise<ChapterLink[]> {
  const res = await fetch(`/api/projects/${projectId}/chapters/links`);
  if (!res.ok) throw new Error("Failed to fetch chapter links");
  return res.json();
}

export async function createChapterLink(projectId: string, sourceId: string, targetId: string, relationship: string, strength: number, description: string): Promise<ChapterLink> {
  const res = await fetch(`/api/projects/${projectId}/chapters/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_chapter_id: sourceId, target_chapter_id: targetId, relationship, strength, description })
  });
  if (!res.ok) throw new Error("Failed to create chapter link");
  return res.json();
}

export async function deleteChapterLink(projectId: string, linkId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/chapters/links/${linkId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete chapter link");
}

// 4. Story Snapshots API
export async function fetchStorySnapshots(projectId: string): Promise<StorySnapshot[]> {
  const res = await fetch(`/api/projects/${projectId}/story-snapshots`);
  if (!res.ok) throw new Error("Failed to fetch story snapshots");
  return res.json();
}

export async function createStorySnapshot(projectId: string, name: string, description: string, version_type: string): Promise<StorySnapshot> {
  const res = await fetch(`/api/projects/${projectId}/story-snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, version_type })
  });
  if (!res.ok) throw new Error("Failed to create snapshot");
  return res.json();
}

export async function restoreStorySnapshot(projectId: string, snapshotId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/story-snapshots/${snapshotId}/restore`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to restore snapshot");
}

// 5. Chapter Snapshots API
export async function fetchChapterVersions(projectId: string, chapterId: string): Promise<ChapterVersion[]> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/versions`);
  if (!res.ok) throw new Error("Failed to fetch chapter versions");
  return res.json();
}

export async function createChapterVersion(projectId: string, chapterId: string, name: string, description: string, version_type: string): Promise<ChapterVersion> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, version_type })
  });
  if (!res.ok) throw new Error("Failed to create chapter version");
  return res.json();
}

export async function restoreChapterVersion(projectId: string, chapterId: string, versionId: string): Promise<Chapter> {
  const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/versions/${versionId}/restore`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to restore chapter version");
  return res.json();
}

// 6. Story Pulse Analysis
export async function fetchStoryPulse(projectId: string): Promise<StoryPulseReport> {
  const res = await fetch(`/api/projects/${projectId}/chapters/analysis/pulse`);
  if (!res.ok) throw new Error("Failed to fetch story pulse");
  return res.json();
}

export async function dismissStoryInsight(projectId: string, insightId: string, topic: string, decision: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/chapters/analysis/insights/${insightId}/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, decision })
  });
  if (!res.ok) throw new Error("Failed to dismiss story insight");
}
