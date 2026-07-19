import { useEffect } from "react";
import { apiUrl } from "../lib/api";

export function useActivityTracker(
  projectId: string | null,
  entityId: string | null,
  entityType: "chapter" | "scene" | "character" | "location" | "mystery" | "theme" | "thread",
  action: "viewed" | "edited" = "viewed"
) {
  useEffect(() => {
    if (!projectId || !entityId) return;

    const timer = setTimeout(async () => {
      try {
        await fetch(apiUrl(`/api/projects/${projectId}/activity`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityId,
            entityType,
            action
          })
        });
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    }, 2000); // Wait 2s to confirm they actually viewed/edited it

    return () => clearTimeout(timer);
  }, [projectId, entityId, entityType, action]);
}
