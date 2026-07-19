import { useState, useEffect } from "react";
import { fetchTimelineEvents } from "../services/timelineApi";
import { fetchStoryThreads, fetchChapterLinks } from "../services/storyApi";
import type { StoryThread, ChapterLink } from "../models/chapter";
import type { TimelineEvent } from "../models/timeline";

export function useStoryTimeline(projectId: string, chapters: any[], scenes: any[], refreshTrigger?: any) {
  const [canonEvents, setCanonEvents] = useState<TimelineEvent[]>([]);
  const [threads, setThreads] = useState<StoryThread[]>([]);
  const [links, setLinks] = useState<ChapterLink[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimelineData = async () => {
    setLoading(true);
    try {
      const [eventsData, threadsData, linksData] = await Promise.all([
        fetchTimelineEvents(projectId).catch(() => []),
        fetchStoryThreads(projectId).catch(() => []),
        fetchChapterLinks(projectId).catch(() => [])
      ]);
      setCanonEvents(eventsData);
      setThreads(threadsData);
      setLinks(linksData);
    } catch (e) {
      console.error("Story Timeline data loading failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadTimelineData();
    }
  }, [projectId, chapters, scenes, refreshTrigger]);

  return {
    canonEvents,
    threads,
    links,
    loading,
    refresh: loadTimelineData
  };
}
