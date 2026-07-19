import { useState } from "react";
import type { Chapter } from "../../models/chapter";

interface TreeOutlineProps {
  chapters: Chapter[];
  scenes: any[];
  onOpenChapterDetail: (chapterId: string) => void;
  onOpenScene: (chapterId: string, sceneId: string) => void;
}

export function TreeOutline({ chapters, scenes, onOpenChapterDetail, onOpenScene }: TreeOutlineProps) {
  const [collapsedActs, setCollapsedActs] = useState<{ [key: string]: boolean }>({});
  const [collapsedChapters, setCollapsedChapters] = useState<{ [key: string]: boolean }>({});

  const actsMap: { [key: string]: Chapter[] } = {};
  for (const ch of chapters) {
    const actName = ch.act || "Act I";
    if (!actsMap[actName]) actsMap[actName] = [];
    actsMap[actName].push(ch);
  }

  const toggleAct = (act: string) => {
    setCollapsedActs(prev => ({ ...prev, [act]: !prev[act] }));
  };

  const toggleChapter = (id: string) => {
    setCollapsedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedActs = Object.keys(actsMap).sort((a, b) => {
    const aIndex = actsMap[a][0]?.act_index || 1;
    const bIndex = actsMap[b][0]?.act_index || 1;
    return aIndex - bIndex;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "0.5rem 0.25rem" }}>
      <h3 style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem 0" }}>
        Story Navigation Tree
      </h3>

      {sortedActs.map(actName => {
        const isActCollapsed = collapsedActs[actName];
        const actChapters = actsMap[actName].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        return (
          <div key={actName} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div
              onClick={() => toggleAct(actName)}
              style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", padding: "0.4rem 0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}
            >
              <span style={{ fontSize: "0.68rem", color: "#e08e6d" }}>{isActCollapsed ? "▶" : "▼"}</span>
              <strong style={{ fontSize: "0.82rem", color: "#fff", textTransform: "uppercase" }}>{actName}</strong>
            </div>

            {!isActCollapsed && (
              <div style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {actChapters.map(ch => {
                  const isChCollapsed = collapsedChapters[ch.id];
                  const chScenes = scenes.filter(s => s.chapter_id === ch.id).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

                  return (
                    <div key={ch.id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <span
                          onClick={() => toggleChapter(ch.id)}
                          style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "0.25rem" }}
                        >
                          {isChCollapsed ? "▶" : "▼"}
                        </span>
                        <span
                          onClick={() => onOpenChapterDetail(ch.id)}
                          style={{ fontSize: "0.82rem", color: "#b9a6e3", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Ch {ch.chapter_number}: {ch.title}
                        </span>
                      </div>

                      {!isChCollapsed && (
                        <div style={{ paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {chScenes.map((sc, idx) => (
                            <div
                              key={sc.id}
                              onClick={() => onOpenScene(ch.id, sc.id)}
                              style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "0.2rem 0" }}
                            >
                              🎬 {idx + 1}. {sc.title}
                            </div>
                          ))}
                          {chScenes.length === 0 && (
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)", fontStyle: "italic", paddingLeft: "0.5rem" }}>
                              No scenes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
