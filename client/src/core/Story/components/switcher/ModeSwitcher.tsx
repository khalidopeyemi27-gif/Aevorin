

interface ModeSwitcherProps {
  activeMode: 'board' | 'tree' | 'timeline';
  onModeChange: (mode: 'board' | 'tree' | 'timeline') => void;
}

export function ModeSwitcher({ activeMode, onModeChange }: ModeSwitcherProps) {
  const modes = [
    { id: "board", label: "Board" },
    { id: "tree", label: "Tree" },
    { id: "timeline", label: "Timeline" }
  ] as const;

  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "0.25rem", marginBottom: "1rem" }}>
      {modes.map(mode => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            style={{ flex: 1, background: isActive ? "#e08e6d" : "none", border: "none", color: isActive ? "#fff" : "rgba(255,255,255,0.45)", padding: "0.55rem 0", borderRadius: "8px", fontSize: "0.82rem", fontWeight: isActive ? "bold" : "normal", cursor: "pointer", transition: "all 0.15s ease-in-out" }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
