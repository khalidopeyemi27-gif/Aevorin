import React from "react";

export interface StoryEntitySuggestion {
  id: string;
  type: string;
  title: string;
  summary?: string;
}

interface MentionSuggestPopoverProps {
  query: string;
  triggerType: "character" | "location";
  suggestions: StoryEntitySuggestion[];
  onSelect: (entity: StoryEntitySuggestion) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function MentionSuggestPopover({
  query,
  triggerType,
  suggestions = [],
  onSelect,
  onClose,
  position
}: MentionSuggestPopoverProps) {
  // Fuzzy search filter
  const q = (query || "").toLowerCase();
  const filtered = suggestions.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(q);
    const typeMatch = triggerType === "character" 
      ? item.type === "character" || item.type === "faction" 
      : item.type === "location" || item.type === "world";
    return typeMatch && titleMatch;
  });

  return (
    <div
      className="mention-popover animate-scale-in"
      style={{
        position: position ? "absolute" : "fixed",
        top: position ? `${position.top}px` : "20%",
        left: position ? `${position.left}px` : "30%",
        zIndex: 99999,
        width: "280px",
        maxHeight: "260px",
        overflowY: "auto",
        background: "#1c1b29",
        border: `1px solid ${triggerType === "character" ? "#9f8ad055" : "#e08e6d55"}`,
        borderRadius: "10px",
        boxShadow: "0 10px 28px rgba(0,0,0,0.6)",
        padding: "0.5rem"
      }}
    >
      <div style={{
        fontSize: "0.68rem",
        fontWeight: 800,
        color: triggerType === "character" ? "#9f8ad0" : "#e08e6d",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "0.3rem 0.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: "0.4rem",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span>{triggerType === "character" ? "👤 Mention Character" : "🏰 Mention Location"}</span>
        <span style={{ opacity: 0.5 }}>Esc to close</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "0.75rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          No matching {triggerType}s found
        </div>
      ) : (
        filtered.map((ent) => (
          <div
            key={ent.id}
            onClick={() => onSelect(ent)}
            style={{
              padding: "0.5rem 0.6rem",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background 0.15s",
              marginBottom: "0.2rem"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>
              {triggerType === "character" ? "@" : "#"}{ent.title}
            </div>
            {ent.summary && (
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {ent.summary}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
