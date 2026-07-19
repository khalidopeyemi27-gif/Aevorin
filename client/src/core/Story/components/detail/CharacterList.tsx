import type { CharacterRef } from "../../models/chapter";

interface CharacterListProps {
  characters: CharacterRef[];
}

export function CharacterList({ characters }: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
        No characters active in this chapter's scenes
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {characters.map(char => (
        <div key={char.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "rgba(159,138,208,0.1)", border: "1px solid rgba(159,138,208,0.2)", borderRadius: "20px", padding: "0.3rem 0.7rem", fontSize: "0.77rem", color: "#b9a6e3" }}>
          <span>👤</span>
          <span style={{ fontWeight: "bold" }}>{char.name}</span>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>({char.role})</span>
        </div>
      ))}
    </div>
  );
}
