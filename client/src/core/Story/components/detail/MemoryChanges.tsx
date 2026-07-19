import type { MemoryChangeRef } from "../../models/chapter";

interface MemoryChangesProps {
  changes: MemoryChangeRef[];
}

export function MemoryChanges({ changes }: MemoryChangesProps) {
  if (changes.length === 0) {
    return (
      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
        No memory state events logged in this chapter
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {changes.map((c, idx) => (
        <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
            <span>{c.event}</span>
            <span style={{ color: "#9f8ad0", fontWeight: "bold" }}>{c.type}</span>
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#fff", marginTop: "0.15rem" }}>
            {c.character}
          </div>
          <div style={{ fontSize: "0.77rem", color: "#e08e6d", marginTop: "0.15rem", fontStyle: "italic" }}>
            {c.change}
          </div>
        </div>
      ))}
    </div>
  );
}
