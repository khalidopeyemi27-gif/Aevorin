import type { Chapter } from "../../models/chapter";
import type { ActGroup } from "../../utils/chapterGrouping";
import { ActSection } from "./ActSection";

interface BoardViewProps {
  actGroups: ActGroup[];
  scenes: any[];
  entities: any[];
  onMoveChapterUp: (id: string) => void;
  onMoveChapterDown: (id: string) => void;
  onEditChapter: (ch: Chapter) => void;
  onOpenChapter: (id: string) => void;
}

export function BoardView({ actGroups, scenes, entities, onMoveChapterUp, onMoveChapterDown, onEditChapter, onOpenChapter }: BoardViewProps) {
  if (actGroups.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: "4rem", color: "rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "2.5rem" }}>📖</span>
        <p style={{ fontSize: "0.85rem", margin: 0 }}>No chapters found in outline.</p>
        <p style={{ fontSize: "0.75rem", margin: 0, color: "rgba(255,255,255,0.18)" }}>Tap the ⊕ button below to start plotting your first chapter.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {actGroups.map(group => (
        <ActSection
          key={group.act}
          actName={group.act}
          chapters={group.chapters}
          scenes={scenes}
          entities={entities}
          onMoveChapterUp={onMoveChapterUp}
          onMoveChapterDown={onMoveChapterDown}
          onEditChapter={onEditChapter}
          onOpenChapter={onOpenChapter}
        />
      ))}
    </div>
  );
}
