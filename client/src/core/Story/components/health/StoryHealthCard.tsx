import { useState, useEffect } from "react";
import { fetchStoryPulse, dismissStoryInsight } from "../../services/storyApi";
import type { StoryInsight } from "../../models/chapter";

interface StoryPulseProps {
  projectId: string;
  refreshTrigger?: number;
  onRefreshTrigger?: () => void;
}

export function StoryPulse({ projectId, refreshTrigger = 0, onRefreshTrigger }: StoryPulseProps) {
  const [intelEnabled, setIntelEnabled] = useState(() => {
    return localStorage.getItem(`aevorin_intel_enabled_${projectId}`) !== "false";
  });
  const [pulse, setPulse] = useState<{ stable: boolean; insights: StoryInsight[] }>({ stable: true, insights: [] });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadPulse = async () => {
    try {
      const data = await fetchStoryPulse(projectId);
      setPulse(data);
    } catch (e) {
      console.error("Failed to load Story Pulse:", e);
    }
  };

  useEffect(() => {
    if (projectId && intelEnabled) {
      loadPulse();
    }
  }, [projectId, intelEnabled, refreshTrigger]);

  const handleToggleIntel = () => {
    const nextVal = !intelEnabled;
    setIntelEnabled(nextVal);
    localStorage.setItem(`aevorin_intel_enabled_${projectId}`, String(nextVal));
  };

  const handleDismiss = async (insightId: string, topic: string) => {
    try {
      await dismissStoryInsight(projectId, insightId, topic, "intentional_mystery");
      await loadPulse();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: "structure", label: "📐 Structure", color: "#9f8ad0" },
    { id: "characters", label: "👥 Characters", color: "#b9a6e3" },
    { id: "mysteries", label: "❓ Mysteries", color: "#e08e6d" },
    { id: "timeline", label: "⏳ Timeline", color: "#ef4444" },
    { id: "world", label: "🌎 World", color: "#4caf50" }
  ];

  if (!intelEnabled) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>✍️ Story Intelligence is quiet</span>
        <button
          onClick={handleToggleIntel}
          style={{ background: "none", border: "none", color: "#e08e6d", fontSize: "0.82rem", fontWeight: "bold", cursor: "pointer" }}
        >
          Enable 🧠
        </button>
      </div>
    );
  }

  const activeInsights = pulse.insights || [];
  const activeInsightsCount = activeInsights.length;
  const isStable = activeInsightsCount === 0;

  return (
    <div style={{ background: isStable ? "rgba(76, 175, 80, 0.05)" : "rgba(224, 142, 109, 0.05)", borderRadius: "12px", border: isStable ? "1px solid rgba(76, 175, 80, 0.15)" : "1px solid rgba(224, 142, 109, 0.15)", padding: "1rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      
      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{isStable ? "🙂" : "⚠"}</span>
          <span style={{ fontSize: "0.88rem", fontWeight: "bold", color: isStable ? "#4caf50" : "#e08e6d" }}>
            {isStable ? "Story feels stable" : "Story Pulse"}
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {!isStable && (
            <span style={{ fontSize: "0.72rem", background: "rgba(224,142,109,0.15)", color: "#e08e6d", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "bold" }}>
              {activeInsightsCount} thread notices
            </span>
          )}
          <button
            onClick={handleToggleIntel}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", cursor: "pointer" }}
          >
            Mute ✍️
          </button>
        </div>
      </div>

      {isStable && (
        <p style={{ margin: "0 0 0 1.6rem", fontSize: "0.77rem", color: "rgba(255,255,255,0.45)" }}>
          Structure and thread pacing feel stable.
        </p>
      )}

      {/* Categorized List */}
      {!isStable && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.25rem" }}>
          {categories.map(cat => {
            const catInsights = activeInsights.filter(i => i.category === cat.id);
            if (catInsights.length === 0) return null;

            const isExpanded = expandedCategory === cat.id;

            return (
              <div key={cat.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", overflow: "hidden" }}>
                <div
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0.75rem", cursor: "pointer", background: "rgba(255,255,255,0.01)" }}
                >
                  <span style={{ fontSize: "0.77rem", color: cat.color, fontWeight: "bold" }}>
                    {cat.label} ({catInsights.length})
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.65rem", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                    {catInsights.map(ins => (
                      <div key={ins.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.4, flex: 1 }}>
                          • {ins.message}
                        </div>
                        <button
                          onClick={() => handleDismiss(ins.id, ins.message)}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", cursor: "pointer", padding: "0.15rem 0.35rem" }}
                        >
                          Ignore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
