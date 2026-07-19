import type { TimelineEvent as TimelineEventType } from "../../models/timeline";

interface TimelineEventProps {
  event: TimelineEventType;
}

export function TimelineEvent({ event }: TimelineEventProps) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
        <span>Event • {event.date}</span>
        <span style={{ color: event.type === "relationship" ? "#e08e6d" : "#9f8ad0", fontWeight: "bold" }}>
          {event.type.toUpperCase()}
        </span>
      </div>

      <h4 style={{ fontSize: "0.88rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
        {event.title}
      </h4>

      {event.description && (
        <p style={{ margin: 0, fontSize: "0.77rem", color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.35 }}>
          {event.description}
        </p>
      )}

      {event.changes && event.changes.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.45rem", marginTop: "0.1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {event.changes.map((c, idx) => (
            <div key={idx} style={{ fontSize: "0.75rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{c.entity}</span>
              <span style={{ color: "#e08e6d", fontWeight: "bold" }}>{c.new}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
