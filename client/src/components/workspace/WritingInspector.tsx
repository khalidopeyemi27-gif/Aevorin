import React from "react";

interface WritingInspectorProps {
  activeScene: {
    id: string;
    title: string;
    word_count?: number;
    status?: string;
    pov_entity_id?: string | null;
    purpose?: string;
    conflict?: string;
    mood?: string;
    location_entity_id?: string | null;
  } | null;
  entities: any[];
  onClose: () => void;
  onJumpToStoryRoom?: (entityId: string) => void;
}

export function WritingInspector({
  activeScene,
  entities = [],
  onClose,
  onJumpToStoryRoom
}: WritingInspectorProps) {
  if (!activeScene) {
    return (
      <div style={{ width: "260px", padding: "1.25rem", background: "#14131d", borderLeft: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
        No scene selected.
      </div>
    );
  }

  const povEntity = entities.find((e) => e.id === activeScene.pov_entity_id);
  const locationEntity = entities.find((e) => e.id === activeScene.location_entity_id);
  const charactersInScene = entities.filter((e) => e.type === "character").slice(0, 4);

  return (
    <div style={{
      width: "280px",
      minWidth: "280px",
      height: "100%",
      background: "#14131d",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.1rem",
      color: "#fff",
      overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#e08e6d", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800 }}>
            Writing Inspector
          </div>
          <h4 style={{ margin: "0.15rem 0 0 0", fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
            {activeScene.title || "Untitled Scene"}
          </h4>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.2rem", cursor: "pointer" }}>
          ×
        </button>
      </div>

      {/* POV & Location */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>👤 POV</div>
          <div style={{ fontSize: "0.83rem", fontWeight: 700, color: "#9f8ad0", marginTop: "0.2rem" }}>
            {povEntity ? povEntity.title : "Unassigned"}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>🏰 Location</div>
          <div style={{ fontSize: "0.83rem", fontWeight: 700, color: "#e08e6d", marginTop: "0.2rem" }}>
            {locationEntity ? locationEntity.title : "Unassigned"}
          </div>
        </div>
      </div>

      {/* Mood & Conflict */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.3rem" }}>⚡ Conflict / Beat</div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>
          {activeScene.conflict || activeScene.purpose || "No scene conflict defined yet."}
        </p>
      </div>

      {/* Scene Characters */}
      <div>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.4rem" }}>👥 Present Characters</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {charactersInScene.length === 0 ? (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>No characters assigned</span>
          ) : (
            charactersInScene.map((c) => (
              <span
                key={c.id}
                onClick={() => onJumpToStoryRoom && onJumpToStoryRoom(c.id)}
                style={{
                  fontSize: "0.75rem",
                  background: "#9f8ad020",
                  color: "#9f8ad0",
                  border: "1px solid #9f8ad044",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                @{c.title}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Word Count Progress */}
      <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Scene Length</span>
          <span style={{ color: "#fff", fontWeight: 700 }}>{(activeScene.word_count || 0).toLocaleString()} words</span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(52, 211, 153, 0.9)", fontWeight: 600 }}>
          🟢 Autosaved locally
        </div>
      </div>
    </div>
  );
}
