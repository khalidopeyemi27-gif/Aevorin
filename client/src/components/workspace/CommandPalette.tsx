import { useState, useEffect, useRef } from "react";

interface CommandItem {
  id: string;
  name: string;
  category: "Navigation" | "Actions" | "Preferences";
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  onToggleFocus: () => void;
  onSetTheme: (theme: string) => void;
  onCreateChapter: () => void;
  onImportManuscript: () => void;
  onExportEPUB: () => void;
  onBackToDashboard: () => void;
  onOpenSanctuaryOnboarding?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onToggleFocus,
  onSetTheme,
  onCreateChapter,
  onImportManuscript,
  onExportEPUB,
  onBackToDashboard,
  onOpenSanctuaryOnboarding
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    { id: "nav-manuscript", name: "Open Manuscript Editor", category: "Navigation", action: () => onNavigate("manuscript") },
    { id: "nav-outline", name: "Open Outline Board", category: "Navigation", action: () => onNavigate("story") },
    { id: "nav-knowledge", name: "Open Story Bible (Knowledge)", category: "Navigation", action: () => onNavigate("knowledge") },
    { id: "nav-analytics", name: "Open Narratives Analytics", category: "Navigation", action: () => onNavigate("analytics") },
    { id: "nav-backups", name: "Open Snapshots & Backups", category: "Navigation", action: () => onNavigate("backups") },
    
    { id: "act-sanctuary", name: "🌙 Re-run Sanctuary Onboarding Setup", category: "Preferences", action: () => { if (onOpenSanctuaryOnboarding) onOpenSanctuaryOnboarding(); } },
    { id: "act-focus", name: "Toggle Focus Mode (Zen)", category: "Actions", action: onToggleFocus },
    { id: "act-chapter", name: "Create New Chapter", category: "Actions", action: onCreateChapter },
    { id: "act-import", name: "Import Manuscript (.txt/.md)", category: "Actions", action: onImportManuscript },
    { id: "act-export", name: "Export Manuscript (EPUB Compilation)", category: "Actions", action: onExportEPUB },
    { id: "act-dashboard", name: "Back to Home Dashboard", category: "Actions", action: onBackToDashboard },

    { id: "theme-midnight", name: "Use Midnight Theme", category: "Preferences", action: () => onSetTheme("midnight") },
    { id: "theme-night", name: "Use Night Theme", category: "Preferences", action: () => onSetTheme("night") },
    { id: "theme-sepia", name: "Use Sepia Theme", category: "Preferences", action: () => onSetTheme("sepia") },
    { id: "theme-paper", name: "Use Paper Theme", category: "Preferences", action: () => onSetTheme("paper") },
    { id: "theme-forest", name: "Use Forest Theme", category: "Preferences", action: () => onSetTheme("forest") },
    { id: "theme-royal", name: "Use Royal Theme", category: "Preferences", action: () => onSetTheme("royal") },
  ];

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

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
      className="cmd-palette-overlay"
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
        ref={containerRef}
        className="cmd-palette-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "450px",
          overflow: "hidden",
          animation: "scaleIn 0.15s ease-out"
        }}
      >
        {/* Search header */}
        <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
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
              fontSize: "0.95rem"
            }}
          />
          <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem", background: "rgba(255,255,255,0.06)", borderRadius: "4px", color: "var(--text-muted)", fontWeight: "bold" }}>ESC</span>
        </div>

        {/* List items */}
        <div style={{ overflowY: "auto", padding: "0.5rem" }}>
          {filtered.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "6px",
                  background: isSelected ? "var(--accent-primary)" : "transparent",
                  color: isSelected ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.85rem",
                  transition: "background 0.1s"
                }}
              >
                <span>{cmd.name}</span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    opacity: isSelected ? 0.9 : 0.4,
                    color: isSelected ? "#ffffff" : "var(--text-secondary)"
                  }}
                >
                  {cmd.category}
                </span>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No commands matching "{search}"
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div style={{ padding: "0.5rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
          <span>Navigate with ↑↓ keys</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
