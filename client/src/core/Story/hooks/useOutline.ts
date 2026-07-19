import { useState, useEffect } from "react";
import type { Chapter } from "../models/chapter";
import { fetchChapters, createChapter as apiCreateChapter, updateChapter as apiUpdateChapter, deleteChapter as apiDeleteChapter, reorderChapters as apiReorderChapters } from "../services/storyApi";
import { groupChaptersByAct } from "../utils/chapterGrouping";
import type { ActGroup } from "../utils/chapterGrouping";

export function useOutline(projectId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [actGroups, setActGroups] = useState<ActGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOutline = async () => {
    setLoading(true);
    try {
      const data = await fetchChapters(projectId);
      setChapters(data);
      setActGroups(groupChaptersByAct(data));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load outline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutline();
  }, [projectId]);

  const addChapter = async (title: string, act: string, purpose: string, status: string) => {
    const created = await apiCreateChapter(projectId, title, act, purpose, status);
    await loadOutline();
    return created;
  };

  const updateChapterDetails = async (chapterId: string, updates: Partial<Chapter> & { change_reason?: string, source?: string }) => {
    const updated = await apiUpdateChapter(projectId, chapterId, updates);
    await loadOutline();
    return updated;
  };

  const removeChapter = async (chapterId: string) => {
    await apiDeleteChapter(projectId, chapterId);
    await loadOutline();
  };

  const moveChapter = async (chapterId: string, direction: "up" | "down") => {
    const target = chapters.find(c => c.id === chapterId);
    if (!target) return;

    const actName = target.act || "Act I";
    const actGroup = actGroups.find(g => g.act === actName);
    if (!actGroup) return;

    const sortedChs = [...actGroup.chapters];
    const idx = sortedChs.findIndex(c => c.id === chapterId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const prev = sortedChs[idx - 1];
      const tempIndex = target.order_index;
      target.order_index = prev.order_index;
      prev.order_index = tempIndex;
    } else if (direction === "down" && idx < sortedChs.length - 1) {
      const next = sortedChs[idx + 1];
      const tempIndex = target.order_index;
      target.order_index = next.order_index;
      next.order_index = tempIndex;
    } else {
      return;
    }

    const updatesList = chapters.map(c => ({
      id: c.id,
      order_index: c.order_index || 0,
      act_index: c.act_index !== undefined ? c.act_index : 1,
      act: c.act || "Act I"
    }));

    await apiReorderChapters(projectId, updatesList);
    await loadOutline();
  };

  return {
    chapters,
    actGroups,
    loading,
    error,
    refresh: loadOutline,
    addChapter,
    updateChapterDetails,
    removeChapter,
    moveChapter
  };
}
