import { useState, useEffect } from "react";
import type { HealthIssue, StoryHealth } from "../models/health";

export function useStoryHealth(projectId: string, chapters: any[], scenes: any[], refreshTrigger?: any) {
  const [health, setHealth] = useState<StoryHealth>({
    stable: true,
    outlineIssues: [],
    memoryIssues: []
  });

  const analyzeHealth = async () => {
    try {
      const outlineIssues: HealthIssue[] = [];
      const memoryIssues: HealthIssue[] = [];

      for (const ch of chapters) {
        const chScenes = scenes.filter(s => s.chapter_id === ch.id);
        if (chScenes.length === 0) {
          outlineIssues.push({
            type: "outline",
            message: `Chapter "${ch.title}" has no active scenes`,
            severity: "warning",
            targetId: ch.id,
            targetType: "chapter"
          });
        }
        if (!ch.purpose || !ch.purpose.trim()) {
          outlineIssues.push({
            type: "outline",
            message: `Chapter "${ch.title}" has no defined narrative purpose`,
            severity: "info",
            targetId: ch.id,
            targetType: "chapter"
          });
        }
        if (!ch.goal || !ch.goal.trim()) {
          outlineIssues.push({
            type: "outline",
            message: `Chapter "${ch.title}" has no defined goals`,
            severity: "info",
            targetId: ch.id,
            targetType: "chapter"
          });
        }
      }

      for (const sc of scenes) {
        if (!sc.purpose || !sc.purpose.trim()) {
          outlineIssues.push({
            type: "outline",
            message: `Scene "${sc.title}" has no defined goal/purpose`,
            severity: "info",
            targetId: sc.id,
            targetType: "scene"
          });
        }
        if (!sc.conflict || !sc.conflict.trim()) {
          outlineIssues.push({
            type: "outline",
            message: `Scene "${sc.title}" has no defined narrative conflict`,
            severity: "warning",
            targetId: sc.id,
            targetType: "scene"
          });
        }
      }

      const res = await fetch(`/api/projects/${projectId}/canon/reports`);
      if (res.ok) {
        const reports = await res.json();
        const activeReports = reports.filter((r: any) => r.status === "active");
        for (const rep of activeReports) {
          memoryIssues.push({
            type: "memory",
            message: rep.message,
            severity: rep.confidence >= 0.9 ? "warning" : "info",
            targetId: rep.id
          });
        }
      }

      setHealth({
        stable: outlineIssues.length === 0 && memoryIssues.length === 0,
        outlineIssues,
        memoryIssues
      });
    } catch (e) {
      console.error("Story health analyze failed:", e);
    }
  };

  useEffect(() => {
    if (projectId) {
      analyzeHealth();
    }
  }, [projectId, chapters, scenes, refreshTrigger]);

  return {
    health,
    recheck: analyzeHealth
  };
}
