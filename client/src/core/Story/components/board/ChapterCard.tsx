import type { Chapter } from "../../models/chapter";

interface ChapterCardProps {
  chapter: Chapter;
  scenes: any[];
  entities: any[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onOpen: () => void;
}

export function ChapterCard({ chapter, scenes, entities, onMoveUp, onMoveDown, onEdit, onOpen }: ChapterCardProps) {
  const chScenes = scenes.filter(s => s.chapter_id === chapter.id);
  const wordCount = chScenes.reduce((sum, s) => sum + (s.word_count || 0), 0);

  const povCharIds = chScenes.map(s => s.pov_entity_id).filter(Boolean);
  const povChars = entities.filter(e => povCharIds.includes(e.id));

  const statusLabels = {
    draft: { icon: "○", text: "Draft", color: "rgba(255,255,255,0.4)" },
    writing: { icon: "◐", text: "Writing", color: "#e08e6d" },
    complete: { icon: "●", text: "Complete", color: "#4caf50" },
    review: { icon: "△", text: "Review", color: "#9f8ad0" }
  };

  const currentStatus = statusLabels[chapter.status] || statusLabels.draft;

  return (
    <div style={{ background: "#212121", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: "bold" }}>
          Chapter {chapter.chapter_number || 1}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: currentStatus.color, fontWeight: "bold" }}>
          <span>{currentStatus.icon}</span>
          <span>{currentStatus.text}</span>
        </div>
      </div>

      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#fff", fontFamily: "'Source Serif 4',Georgia,serif" }}>
        {chapter.title || "Untitled Chapter"}
      </h3>

      {chapter.goal && (
        <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>
          <strong style={{ color: "#e08e6d" }}>🎯 Goal:</strong> {chapter.goal}
        </div>
      )}
      {chapter.conflict && (
        <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>
          <strong style={{ color: "#ef4444" }}>⚔ Conflict:</strong> {chapter.conflict}
        </div>
      )}
      {!chapter.goal && chapter.purpose && (
        <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>
          <strong style={{ color: "#e08e6d" }}>💡 Intent:</strong> {chapter.purpose}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.65rem", alignItems: "center" }}>
        <span>🎬 {chScenes.length} scenes</span>
        <span>📝 {wordCount.toLocaleString()} words</span>
        
        {povChars.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
            <span>👤</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>
              {povChars.map(c => c.title).slice(0, 2).join(", ")}
              {povChars.length > 2 ? "..." : ""}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.65rem", marginTop: "0.1rem" }}>
        <button
          onClick={onMoveUp}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", color: "#fff", padding: "0.45rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", color: "#fff", padding: "0.45rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ↓
        </button>
        <button
          onClick={onEdit}
          style={{ flex: 2, background: "rgba(159,138,208,0.15)", border: "none", color: "#b9a6e3", padding: "0.45rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.77rem", fontWeight: "bold" }}
        >
          ✎ Edit
        </button>
        <button
          onClick={onOpen}
          style={{ flex: 2, background: "rgba(224,142,109,0.15)", border: "none", color: "#e08e6d", padding: "0.45rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.77rem", fontWeight: "bold" }}
        >
          → View
        </button>
      </div>
    </div>
  );
}
