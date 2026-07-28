import React, { useState } from "react";

interface Chapter {
  id: string;
  title: string;
  order_index: number;
}

interface Scene {
  id: string;
  chapter_id: string | null;
  title: string;
  pov_entity_id: string | null;
  word_count: number;
  status: string;
}

interface Entity {
  id: string;
  type: string;
  title: string;
}

interface PlotMatrixProps {
  chapters: Chapter[];
  scenes: Scene[];
  entities: Entity[];
  onSelectScene?: (chapterId: string, sceneId: string) => void;
  onClose?: () => void;
}

export default function PlotMatrix({
  chapters = [],
  scenes = [],
  entities = [],
  onSelectScene,
  onClose
}: PlotMatrixProps) {
  const [filterType, setFilterType] = useState<"all" | "character" | "location">("character");

  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const safeEntities = Array.isArray(entities) ? entities : [];

  const filteredEntities = safeEntities.filter((e) => {
    if (filterType === "character") return e.type === "character";
    if (filterType === "location") return e.type === "location" || e.type === "world";
    return true;
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      backgroundColor: "#0c101d",
      color: "#fff",
      padding: "1.5rem",
      overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📊 Matrix Plot Board
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.83rem", color: "rgba(255,255,255,0.5)" }}>
            Track character presence, POV density, and scene balance across chapters.
          </p>
        </div>

        {/* Filters & Exit Button */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {(["character", "location", "all"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? "#9f8ad0" : "rgba(255,255,255,0.05)",
                color: filterType === type ? "#fff" : "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {type === "character" ? "👤 Characters" : type === "location" ? "🏰 Locations" : "🌐 All Entities"}
            </button>
          ))}

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
              title="Close Matrix Plot Board & Return to Manuscript"
            >
              ✖ Exit Matrix
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      {safeChapters.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>No chapters created yet. Create chapters in your manuscript to view the Matrix Plot Board.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", background: "rgba(0,0,0,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "1rem", minWidth: "180px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Chapter</th>
                {filteredEntities.map((ent) => (
                  <th key={ent.id} style={{ padding: "1rem 0.75rem", minWidth: "120px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: "#9f8ad0", fontSize: "0.85rem" }}>{ent.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", fontWeight: 400, marginTop: "0.15rem" }}>
                      {safeScenes.filter((s) => s.pov_entity_id === ent.id).length} POVs
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safeChapters.map((ch, idx) => {
                const chScenes = safeScenes.filter((s) => s.chapter_id === ch.id);
                return (
                  <tr key={ch.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }}>
                    {/* Chapter Name & Scene Count */}
                    <td style={{ padding: "1rem", background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{ch.title || `Chapter ${idx + 1}`}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem" }}>
                        {chScenes.length} scene{chScenes.length === 1 ? "" : "s"} • {chScenes.reduce((a, s) => a + (s.word_count || 0), 0).toLocaleString()} words
                      </div>
                    </td>

                    {/* Entity Matrix Cells */}
                    {filteredEntities.map((ent) => {
                      const isPov = chScenes.some((s) => s.pov_entity_id === ent.id);
                      const isMentioned = chScenes.some((s) => (s.title || "").toLowerCase().includes(ent.title.toLowerCase()));

                      return (
                        <td key={ent.id} style={{ padding: "0.75rem", textAlign: "center", verticalAlign: "middle" }}>
                          {isPov ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#9f8ad025",
                              border: "1px solid #9f8ad055",
                              color: "#9f8ad0",
                              padding: "0.3rem 0.6rem",
                              borderRadius: "20px",
                              fontSize: "0.75rem",
                              fontWeight: 700
                            }}>
                              👤 POV
                            </span>
                          ) : isMentioned ? (
                            <span style={{
                              display: "inline-block",
                              background: "rgba(52, 211, 153, 0.15)",
                              border: "1px solid rgba(52, 211, 153, 0.3)",
                              color: "#34d399",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 700
                            }}>
                              ✓ Present
                            </span>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "0.9rem" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
