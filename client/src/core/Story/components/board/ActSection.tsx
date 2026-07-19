import type { Chapter } from "../../models/chapter";
import { ChapterCard } from "./ChapterCard";

interface ActSectionProps {
  actName: string;
  chapters: Chapter[];
  scenes: any[];
  entities: any[];
  onMoveChapterUp: (id: string) => void;
  onMoveChapterDown: (id: string) => void;
  onEditChapter: (ch: Chapter) => void;
  onOpenChapter: (id: string) => void;
}

export function ActSection({ actName, chapters, scenes, entities, onMoveChapterUp, onMoveChapterDown, onEditChapter, onOpenChapter }: ActSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2rem" }}>
      <div style={{ paddingBottom: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#e08e6d", textTransform: "uppercase", margin: 0, letterSpacing: "0.08em" }}>
          {actName}
        </h3>
        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
          {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {chapters.map(chapter => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            scenes={scenes}
            entities={entities}
            onMoveUp={() => onMoveChapterUp(chapter.id)}
            onMoveDown={() => onMoveChapterDown(chapter.id)}
            onEdit={() => onEditChapter(chapter)}
            onOpen={() => onOpenChapter(chapter.id)}
          />
        ))}
      </div>
    </div>
  );
}
