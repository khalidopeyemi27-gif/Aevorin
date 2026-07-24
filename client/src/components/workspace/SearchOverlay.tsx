import { useState, useEffect, useRef } from "react";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  entities: any[];
  scenes: any[];
  chapters: any[];
  onSelectEntity: (entityId: string, category: string) => void;
  onSelectScene: (chapterId: string, sceneId: string) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  entities = [],
  scenes = [],
  chapters = [],
  onSelectEntity,
  onSelectScene
}: SearchOverlayProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];

  // Flatten and prepare searchable items
  const items = [
    // Entities
    ...safeEntities.map(e => ({
      id: `entity-${e.id}`,
      type: "Entity",
      title: e.name || "Unnamed Entity",
      subtitle: e.type || "Unknown",
      action: () => onSelectEntity(e.id, e.type === "character" ? "character" : "world")
    })),
    // Scenes
    ...safeScenes.map(s => {
      const chapter = safeChapters.find(c => c.id === s.chapter_id);
      return {
        id: `scene-${s.id}`,
        type: "Scene",
        title: s.title || "Untitled Scene",
        subtitle: `Chapter: ${chapter?.title || "Unknown"}`,
        action: () => onSelectScene(s.chapter_id, s.id)
      };
    }),
    // Chapters
    ...safeChapters.map(c => ({
      id: `chapter-${c.id}`,
      type: "Chapter",
      title: c.title || "Untitled Chapter",
      subtitle: "Chapter",
      action: () => onSelectScene(c.id, "") // empty scene means jump to chapter
    }))
  ];

  // Fuzzy search implementation
  const filtered = search.trim() === "" 
    ? [] 
    : items.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) || 
        item.subtitle.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20); // limit to 20 results for performance

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-overlay anim-fade-in"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 20000,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "15vh"
      }}
    >
      <div
        className="cmd-palette-box anim-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "60vh",
          overflow: "hidden"
        }}
      >
        {/* Search header */}
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem", opacity: 0.6 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search characters, scenes, chapters, or world..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "1.1rem"
            }}
          />
          <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "rgba(255,255,255,0.06)", borderRadius: "4px", color: "var(--text-muted)", fontWeight: "bold" }}>ESC</span>
        </div>

        {/* List items */}
        <div style={{ overflowY: "auto", padding: "0.5rem", flex: 1 }}>
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  background: isSelected ? "var(--accent-primary)" : "transparent",
                  color: isSelected ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.95rem",
                  transition: "background 0.1s"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  <span style={{ fontSize: "0.75rem", opacity: isSelected ? 0.9 : 0.5, color: isSelected ? "#ffffff" : "var(--text-secondary)" }}>
                    {item.subtitle}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    background: isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)"
                  }}
                >
                  {item.type}
                </span>
              </div>
            );
          })}

          {search.trim() !== "" && filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              No results found for "{search}"
            </div>
          )}
          
          {search.trim() === "" && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem", opacity: 0.5 }}>
              Start typing to search your entire manuscript...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
