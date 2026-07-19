import type { Chapter } from "../../models/chapter";

interface StoryHeaderProps {
  projectName: string;
  chapters: Chapter[];
  scenes: any[];
  entities: any[];
  timelineEventsCount: number;
}

export function StoryHeader({ projectName, chapters, scenes, entities, timelineEventsCount }: StoryHeaderProps) {
  const wordCount = scenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
  const targetWords = chapters.reduce((sum, c) => sum + (c.estimated_word_count || 0), 0) || 80000;
  const progressPercent = Math.min(Math.round((wordCount / targetWords) * 100), 100);

  const characterCount = entities.filter(e => e.type === "character").length;

  return (
    <div style={{ background: "#242424", borderRadius: "14px", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.65rem", color: "#e08e6d", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.25rem" }}>
        Story Room Dashboard
      </div>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", margin: "0 0 0.85rem 0", fontFamily: "'Source Serif 4',Georgia,serif" }}>
        {projectName || "Untitled Masterpiece"}
      </h2>

      {/* Progress Bar */}
      <div style={{ marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.35rem" }}>
          <span>Completion Progress</span>
          <span style={{ fontWeight: "bold", color: "#e08e6d" }}>{progressPercent}%</span>
        </div>
        <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #9f8ad0, #e08e6d)", borderRadius: "4px" }} />
        </div>
      </div>

      {/* Counters Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem", textAlign: "center" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.6rem 0.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{chapters.length}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Chapters</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.6rem 0.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{scenes.length}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Scenes</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.6rem 0.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{wordCount.toLocaleString()}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Words</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.6rem 0.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{characterCount}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Characters</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.6rem 0.4rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", gridColumn: "span 2" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{timelineEventsCount}</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Memory Events</div>
        </div>
      </div>
    </div>
  );
}
