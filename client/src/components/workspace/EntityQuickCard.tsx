import React from "react";

interface EntityQuickCardProps {
  entity: {
    id: string;
    type: string;
    title: string;
    summary?: string;
    metadata?: Record<string, any>;
  } | null;
  position?: { top: number; left: number };
  onClose: () => void;
  onJumpToStoryRoom: (entityId: string, category: string) => void;
}

export function EntityQuickCard({
  entity,
  position,
  onClose,
  onJumpToStoryRoom
}: EntityQuickCardProps) {
  if (!entity) return null;

  const isCharacter = (entity.type || "").toLowerCase() === "character";
  const category = isCharacter ? "character" : "world";
  const badgeColor = isCharacter ? "#9f8ad0" : "#e08e6d";

  return (
    <div
      className="calm-modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.4)",
        zIndex: 99999,
        display: "flex",
        alignItems: position ? "flex-start" : "center",
        justifyContent: position ? "flex-start" : "center",
        padding: position ? 0 : "1.5rem"
      }}
    >
      <div
        className="calm-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: position ? "absolute" : "relative",
          top: position ? `${position.top}px` : undefined,
          left: position ? `${position.left}px` : undefined,
          width: "320px",
          maxWidth: "90vw",
          background: "#1c1b29",
          border: `1px solid ${badgeColor}44`,
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
          color: "#fff"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: badgeColor,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            background: `${badgeColor}18`,
            padding: "0.2rem 0.6rem",
            borderRadius: "12px",
            border: `1px solid ${badgeColor}33`
          }}>
            {isCharacter ? "👤 Character" : "🏰 World Location"}
          </span>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Title */}
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 700, color: "#fff" }}>
          {entity.title}
        </h4>

        {/* Summary */}
        <p style={{
          fontSize: "0.83rem",
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.45,
          marginBottom: "1rem",
          maxHeight: "80px",
          overflowY: "auto"
        }}>
          {entity.summary || "No summary provided for this entity."}
        </p>

        {/* Metadata Badges */}
        {entity.metadata && Object.keys(entity.metadata).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
            {Object.entries(entity.metadata).slice(0, 4).map(([key, val]) => (
              <span key={key} style={{
                fontSize: "0.7rem",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.6)",
                padding: "0.15rem 0.5rem",
                borderRadius: "4px"
              }}>
                <strong style={{ color: "#fff" }}>{key}:</strong> {String(val)}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => {
              onClose();
              onJumpToStoryRoom(entity.id, category);
            }}
            style={{
              flex: 1,
              background: badgeColor,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.55rem 0.85rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem"
            }}
          >
            📖 Open in Story Room →
          </button>
        </div>
      </div>
    </div>
  );
}
