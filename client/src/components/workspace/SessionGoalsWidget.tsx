import React, { useState, useEffect } from "react";

interface SessionGoalsWidgetProps {
  currentWordCount: number;
  targetDailyWords?: number;
}

export function SessionGoalsWidget({
  currentWordCount,
  targetDailyWords = 1000
}: SessionGoalsWidgetProps) {
  const [sessionStartWords] = useState(currentWordCount);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes((m) => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const sessionWords = Math.max(0, currentWordCount - sessionStartWords);
  const progressPct = Math.min(Math.round((currentWordCount / targetDailyWords) * 100), 100);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Compact Widget */}
      <div
        onClick={() => setShowDetail(!showDetail)}
        style={{
          background: "rgba(15, 14, 13, 0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "0.35rem 0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>
          🎯 Goal: {currentWordCount} / {targetDailyWords}
        </span>

        <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #9f8ad0, #e08e6d)" }} />
        </div>

        <span style={{ fontSize: "0.72rem", color: "#e08e6d", fontWeight: 800 }}>
          {progressPct}%
        </span>
      </div>

      {/* Expanded Modal Popover */}
      {showDetail && (
        <div
          className="animate-scale-in"
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            width: "240px",
            background: "#1c1b29",
            border: "1px solid rgba(224, 142, 109, 0.3)",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
            zIndex: 9999,
            color: "#fff"
          }}
        >
          <div style={{ fontSize: "0.68rem", color: "#e08e6d", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.5rem" }}>
            Session Writing Goals
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Session Words</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>+{sessionWords}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Today's Total</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{currentWordCount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Writing Time</span>
              <span style={{ color: "#9f8ad0", fontWeight: 700 }}>{sessionMinutes} min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
