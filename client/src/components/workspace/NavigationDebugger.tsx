import React from "react";
import { useNavigation } from "../../core/navigation/NavigationContext";
import { BACK_PRIORITY } from "../../core/navigation/BackPriority";

export const NavigationDebugger: React.FC = () => {
  const { getActiveHandlers } = useNavigation();
  const handlers = getActiveHandlers();

  if (localStorage.getItem("aevorin_dev_mode") !== "true") return null;

  // Find priority names for display
  const getPriorityName = (p: number) => {
    for (const [key, val] of Object.entries(BACK_PRIORITY)) {
      if (val === p) return key;
    }
    return `Custom(${p})`;
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      padding: "1rem",
      borderRadius: "12px",
      color: "#0f0",
      fontFamily: "monospace",
      fontSize: "0.75rem",
      zIndex: 999999,
      pointerEvents: "none",
      minWidth: "250px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
    }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "0.5rem", marginBottom: "0.5rem", fontWeight: "bold", color: "#fff" }}>
        Navigation Stack Debugger
      </div>
      
      {handlers.length === 0 ? (
        <div style={{ color: "#aaa" }}>No active handlers (Native Back exits app)</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {handlers.map((h, i) => (
            <div key={h.id} style={{
              display: "flex",
              justifyContent: "space-between",
              opacity: i === 0 ? 1 : 0.6,
              background: i === 0 ? "rgba(0,255,0,0.1)" : "transparent",
              padding: "0.15rem 0.25rem",
              borderRadius: "4px"
            }}>
              <span>{i + 1}. {h.id}</span>
              <span style={{ color: "#ffaa00" }}>{getPriorityName(h.priority)}</span>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "0.5rem", color: "#aaa" }}>
        Current depth: {handlers.length}
        <div style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
          * Top item intercepts back next
        </div>
      </div>
    </div>
  );
};
