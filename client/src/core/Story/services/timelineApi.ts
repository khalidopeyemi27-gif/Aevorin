import type { TimelineEvent } from "../models/timeline";

export async function fetchTimelineEvents(projectId: string): Promise<TimelineEvent[]> {
  const res = await fetch(`/api/projects/${projectId}/canon/events`);
  if (!res.ok) throw new Error("Failed to fetch timeline events");
  const data = await res.json();
  
  return data.map((ev: any) => {
    const changes: any[] = [];
    if (ev.changes) {
      for (const ch of ev.changes) {
        changes.push({
          entity: ch.character_name || "Character",
          field: ch.field,
          old: ch.old_value,
          new: ch.new_value
        });
      }
    }
    if (ev.relationshipChanges) {
      for (const rc of ev.relationshipChanges) {
        changes.push({
          entity: `${rc.character_a_name || "A"} ↔ ${rc.character_b_name || "B"}`,
          field: "relationship",
          old: rc.old_relationship,
          new: rc.new_relationship
        });
      }
    }

    return {
      id: ev.id,
      type: ev.relationshipChanges && ev.relationshipChanges.length > 0 ? "relationship" : "character",
      date: ev.position_key,
      chapter_id: ev.chapter_id || undefined,
      scene_id: ev.scene_id || undefined,
      title: ev.title || "Canon Event",
      description: ev.description || "",
      changes
    };
  });
}

export async function fetchRelationshipChanges(projectId: string): Promise<any[]> {
  const res = await fetch(`/api/projects/${projectId}/canon/relationships/changes`);
  if (!res.ok) throw new Error("Failed to fetch relationship changes");
  return res.json();
}
