import type { StoryThread, ChapterLink, Chapter } from "../../models/chapter";

interface TimelineOutlineProps {
  chapters: Chapter[];
  scenes: any[];
  threads: StoryThread[];
  links: ChapterLink[];
  onOpenChapterDetail: (chapterId: string) => void;
}

export function TimelineOutline({
  chapters,
  scenes,
  threads,
  links,
  onOpenChapterDetail
}: TimelineOutlineProps) {
  if (chapters.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: "4rem", color: "rgba(255,255,255,0.25)" }}>
        No chapters or scenes found. Create chapters to build the story architecture timeline.
      </div>
    );
  }

  // Sort chapters sequentially by act index and order index
  const sortedChapters = [...chapters].sort((a, b) => {
    if (a.act_index !== b.act_index) return a.act_index - b.act_index;
    return a.order_index - b.order_index;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem" }}>
        📌 <strong>Outline Timeline</strong>: Story architecture sequence and planned roadmap.
      </div>

      <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "1.5rem" }}>
        <div style={{ position: "absolute", left: "6px", top: "10px", bottom: "10px", width: "2px", background: "rgba(224, 142, 109, 0.15)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {sortedChapters.map((ch) => {
            const chScenes = scenes.filter(s => s.chapter_id === ch.id);
            const chLinks = links.filter(l => l.source_chapter_id === ch.id);
            const chThreads = threads.filter(t => t.chapters?.some(tc => tc.chapter_id === ch.id));

            return (
              <div key={ch.id} style={{ position: "relative" }}>
                {/* Dot marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "-23px",
                    top: "10px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#e08e6d",
                    border: "2px solid #1a1a1a",
                    boxShadow: "0 0 8px #e08e6d"
                  }}
                />

                <div
                  onClick={() => onOpenChapterDetail(ch.id)}
                  style={{
                    background: "rgba(224,142,109,0.02)",
                    border: "1px solid rgba(224,142,109,0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}
                >
                  {/* Chapter Header */}
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {ch.act || "Act I"} • Chapter {ch.chapter_number}
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fff", margin: "0.15rem 0 0 0", fontFamily: "'Source Serif 4',Georgia,serif" }}>
                      {ch.title || "Untitled Chapter"}
                    </h4>
                  </div>

                  {/* Goal and Conflict */}
                  {(ch.goal || ch.conflict) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", background: "rgba(255,255,255,0.01)", padding: "0.5rem", borderRadius: "6px" }}>
                      {ch.goal && (
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>Goal:</span>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>{ch.goal}</div>
                        </div>
                      )}
                      {ch.conflict && (
                        <div>
                          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>Conflict:</span>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>{ch.conflict}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scenes hierarchy */}
                  {chScenes.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(255,255,255,0.05)" }}>
                      {chScenes.map((s, sIdx) => (
                        <div key={s.id} style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.6)" }}>
                          <span style={{ color: "#e08e6d", fontWeight: "bold", marginRight: "0.35rem" }}>{sIdx + 1}.</span>
                          {s.title || "Untitled Scene"}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chapter Linkages */}
                  {chLinks.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {chLinks.map(link => (
                        <span
                          key={link.id}
                          style={{
                            fontSize: "0.65rem",
                            background: "rgba(159,138,208,0.15)",
                            color: "#b9a6e3",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                            fontWeight: "bold"
                          }}
                        >
                          ➜ {link.relationship.toUpperCase()} Chapter {link.target_number || "?"}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mapped Threads progression */}
                  {chThreads.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {chThreads.map(th => {
                        const mapping = th.chapters?.find(tc => tc.chapter_id === ch.id);
                        return (
                          <span
                            key={th.id}
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(224,142,109,0.15)",
                              color: "#e08e6d",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              fontWeight: "bold"
                            }}
                          >
                            🧵 {th.name}: {mapping?.role.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
