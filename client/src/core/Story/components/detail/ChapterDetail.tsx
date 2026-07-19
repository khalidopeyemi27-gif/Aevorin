import { useState, useEffect } from "react";
import type { Chapter, ChapterContext } from "../../models/chapter";
import { fetchChapterContext, createChapterLink, deleteChapterLink, createChapterVersion, restoreChapterVersion } from "../../services/storyApi";
import { CharacterList } from "./CharacterList";
import { MemoryChanges } from "./MemoryChanges";

interface ChapterDetailProps {
  projectId: string;
  chapterId: string;
  chapters: Chapter[];
  onClose: () => void;
  onOpenManuscript: (chapterId: string, sceneId?: string) => void;
  onRefreshTrigger?: () => void;
}

export function ChapterDetail({ projectId, chapterId, chapters, onClose, onOpenManuscript, onRefreshTrigger }: ChapterDetailProps) {
  const [context, setContext] = useState<ChapterContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Link Creation
  const [targetLinkId, setTargetLinkId] = useState("");
  const [linkRel, setLinkRel] = useState<'foreshadows' | 'continues' | 'causes' | 'contrasts' | 'references' | 'mirrors' | 'resolves' | 'introduces' | 'reveals' | 'pays_off' | 'character_arc' | 'world_building'>("foreshadows");
  const [linkStrength, setLinkStrength] = useState(50);
  const [linkDesc, setLinkDesc] = useState("");

  // States for named recovery snapshots (Story Memories)
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDesc, setNewSnapshotDesc] = useState("");
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const loadContext = async () => {
    setLoading(true);
    try {
      const data = await fetchChapterContext(projectId, chapterId);
      setContext(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load chapter details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && chapterId) {
      loadContext();
    }
  }, [projectId, chapterId]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLinkId) return;
    try {
      await createChapterLink(projectId, chapterId, targetLinkId, linkRel, linkStrength, linkDesc);
      setTargetLinkId("");
      setLinkDesc("");
      await loadContext();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await deleteChapterLink(projectId, linkId);
      await loadContext();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;
    setCreatingSnapshot(true);
    try {
      await createChapterVersion(projectId, chapterId, newSnapshotName.trim(), newSnapshotDesc.trim(), "manual");
      setNewSnapshotName("");
      setNewSnapshotDesc("");
      await loadContext();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async (versionId: string) => {
    const confirm = window.confirm("Are you sure you want to restore this snapshot memory? An automatic backup of your current chapter state will be saved first.");
    if (!confirm) return;
    try {
      await restoreChapterVersion(projectId, chapterId, versionId);
      await loadContext();
      if (onRefreshTrigger) onRefreshTrigger();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "5rem", color: "rgba(255,255,255,0.4)" }}>
        Loading chapter details...
      </div>
    );
  }

  if (error || !context) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
        <button onClick={onClose} style={{ display: "block", margin: "0 auto 1.5rem auto", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>
          ← Back to Outline
        </button>
        <p>{error || "Failed to load context"}</p>
      </div>
    );
  }

  const { chapter, scenes, characters, memoryChanges, warnings, history, links, versions } = context;

  const sectionStyle = {
    marginBottom: "1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    paddingBottom: "1.2rem"
  };

  const labelStyle = {
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.08em",
    fontWeight: 600,
    marginBottom: "0.45rem",
    display: "block"
  };

  // Connection strength category helper
  const getStrengthLabel = (str: number) => {
    if (str <= 25) return { text: "Weak Connection", color: "rgba(255,255,255,0.35)" };
    if (str <= 50) return { text: "Moderate", color: "#b9a6e3" };
    if (str <= 75) return { text: "Strong", color: "#e08e6d" };
    return { text: "Critical", color: "#ef4444" };
  };

  const otherChaptersForLinks = chapters.filter(c => c.id !== chapterId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1a1a1a", color: "#fff", overflowY: "auto", padding: "1.5rem" }}>
      
      {/* Top Header Transition Panel */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.5rem", flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.3rem", padding: 0 }}
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {chapter.act || "Act I"} • Chapter {chapter.chapter_number}
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#fff", fontFamily: "'Source Serif 4',Georgia,serif" }}>
            {chapter.title || "Untitled"}
          </h2>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "12px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
          {chapter.status.toUpperCase()}
        </span>
      </div>

      {/* 1. Intent & DNA parameters */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Narrative Intent</span>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>🎯 Goal</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.goal || "None"}</p>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>⚔ Conflict</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.conflict || "None"}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>🎭 Emotional Target</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "#e08e6d" }}>{chapter.emotional_target || "None"}</p>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>🎬 Reader Experience</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.reader_effect || "None"}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>🔑 Theme Focus</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "#b9a6e3" }}>{chapter.theme_focus || "None"}</p>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>❓ Chapter Question</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.chapter_question || "None"}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>⚡ Turning Point</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.turning_point || "None"}</p>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>🧬 Consequence</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{chapter.consequence || "None"}</p>
          </div>
        </div>

        {chapter.summary && (
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>📋 Summary</div>
            <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{chapter.summary}</p>
          </div>
        )}
      </div>

      {/* 2. Story Connections Graph */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Story Connections</span>

        {/* Existing Connections List */}
        {(!links.outgoing || links.outgoing.length === 0) && (!links.incoming || links.incoming.length === 0) ? (
          <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            No structural connections mapped to other chapters yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
            {links.outgoing.map(link => {
              const strInfo = getStrengthLabel(link.strength);
              return (
                <div key={link.id} style={{ background: "rgba(224,142,109,0.03)", border: "1px solid rgba(224,142,109,0.08)", borderRadius: "8px", padding: "0.55rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.77rem", color: "#fff", fontWeight: "bold" }}>
                      ➜ {link.relationship.toUpperCase()} Chapter {link.target_number}: "{link.target_title}"
                    </div>
                    {link.description && (
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>
                        {link.description}
                      </div>
                    )}
                    <span style={{ fontSize: "0.65rem", color: strInfo.color }}>
                      {strInfo.text} ({link.strength}%)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(link.id)}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}

            {links.incoming.map(link => {
              const strInfo = getStrengthLabel(link.strength);
              return (
                <div key={link.id} style={{ background: "rgba(159,138,208,0.03)", border: "1px solid rgba(159,138,208,0.08)", borderRadius: "8px", padding: "0.55rem 0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.77rem", color: "#fff", fontWeight: "bold" }}>
                      🠔 Chapter {link.source_number}: "{link.source_title}" {link.relationship.toUpperCase()} here
                    </div>
                    {link.description && (
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>
                        {link.description}
                      </div>
                    )}
                    <span style={{ fontSize: "0.65rem", color: strInfo.color }}>
                      {strInfo.text} ({link.strength}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link Creation Widget */}
        <form onSubmit={handleAddLink} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(255,255,255,0.5)" }}>Create Connection</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <select
              required
              value={targetLinkId}
              onChange={e => setTargetLinkId(e.target.value)}
              style={{ background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.45rem", fontSize: "0.77rem" }}
            >
              <option value="">Select Target Chapter...</option>
              {otherChaptersForLinks.map(oc => (
                <option key={oc.id} value={oc.id}>Ch {oc.chapter_number}: {oc.title}</option>
              ))}
            </select>

            <select
              value={linkRel}
              onChange={e => setLinkRel(e.target.value as any)}
              style={{ background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.45rem", fontSize: "0.77rem" }}
            >
              <option value="foreshadows">Foreshadows</option>
              <option value="continues">Continues</option>
              <option value="causes">Causes</option>
              <option value="contrasts">Contrasts</option>
              <option value="references">References</option>
              <option value="mirrors">Mirrors</option>
              <option value="resolves">Resolves</option>
              <option value="introduces">Introduces</option>
              <option value="reveals">Reveals</option>
              <option value="pays_off">Pays Off</option>
              <option value="character_arc">Character Arc</option>
              <option value="world_building">World Building</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", width: "3.5rem" }}>Strength:</span>
            <input
              type="range"
              min="1"
              max="100"
              value={linkStrength}
              onChange={e => setLinkStrength(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: "0.72rem", color: "#e08e6d", width: "2rem", textAlign: "right" }}>{linkStrength}%</span>
          </div>

          <input
            type="text"
            placeholder="Link Description (e.g. choice details)..."
            value={linkDesc}
            onChange={e => setLinkDesc(e.target.value)}
            style={{ background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.45rem", fontSize: "0.77rem" }}
          />

          <button
            type="submit"
            style={{ background: "#e08e6d", border: "none", color: "#fff", padding: "0.45rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.77rem", fontWeight: "bold" }}
          >
            ＋ Add Connection Link
          </button>
        </form>
      </div>

      {/* 3. Scenes List */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Scenes ({scenes.length})</span>
        {scenes.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            No scenes added to this chapter yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {scenes.map((sc, i) => (
              <div
                key={sc.id}
                onClick={() => onOpenManuscript(chapter.id, sc.id)}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.75rem", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.82rem", color: "#e08e6d" }}>
                    {String(i + 1).padStart(2, "0")} {sc.title}
                  </strong>
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>Tap to write →</span>
                </div>
                {sc.goal && (
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.3rem" }}>
                    <strong>Goal:</strong> {sc.goal}
                  </div>
                )}
                {sc.conflict && (
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>
                    <strong>Conflict:</strong> {sc.conflict}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Characters In Chapter */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Characters Involved</span>
        <CharacterList characters={characters} />
      </div>

      {/* 5. Memory Event Changes */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Evolving Memory Chronology</span>
        <MemoryChanges changes={memoryChanges} />
      </div>

      {/* 6. Continuity Warnings */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Continuity Warnings</span>
        {warnings.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.77rem", color: "rgba(76,175,80,0.6)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>✓</span> Universe stable. No warnings mapped.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {warnings.map(w => (
              <div key={w.id} style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "0.6rem 0.75rem", fontSize: "0.77rem", color: "rgba(255,255,255,0.8)", display: "flex", gap: "0.45rem" }}>
                <span style={{ color: "#ef4444" }}>⚠</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{w.affected_character || "Character"}</div>
                  <div style={{ marginTop: "0.15rem" }}>{w.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Story Memories snapshots */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Story Memories</span>

        {/* Existing Snapshots */}
        {versions.length === 0 ? (
          <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            No memories saved for this chapter.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1rem" }}>
            {versions.map(ver => (
              <div key={ver.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.77rem", color: "#fff", fontWeight: "bold" }}>
                    ⭐ {ver.name}
                  </div>
                  {ver.description && (
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>
                      {ver.description}
                    </div>
                  )}
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>
                    {ver.version_type.toUpperCase()} • {new Date(ver.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRestoreSnapshot(ver.id)}
                  style={{ background: "rgba(224,142,109,0.15)", border: "none", color: "#e08e6d", padding: "0.3rem 0.55rem", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save Snapshot Form */}
        <form onSubmit={handleCreateSnapshot} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "rgba(255,255,255,0.5)" }}>Save Chapter Memory Snapshot</div>
          
          <input
            type="text"
            required
            placeholder="Memory name (e.g. Before villain reveal rewrite)..."
            value={newSnapshotName}
            onChange={e => setNewSnapshotName(e.target.value)}
            style={{ background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.45rem", fontSize: "0.77rem" }}
          />

          <input
            type="text"
            placeholder="Description details (optional)..."
            value={newSnapshotDesc}
            onChange={e => setNewSnapshotDesc(e.target.value)}
            style={{ background: "#2d2d2d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.45rem", fontSize: "0.77rem" }}
          />

          <button
            type="submit"
            disabled={creatingSnapshot}
            style={{ background: "#9f8ad0", border: "none", color: "#fff", padding: "0.45rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.77rem", fontWeight: "bold" }}
          >
            {creatingSnapshot ? "Saving..." : "💾 Save Memory Snapshot"}
          </button>
        </form>
      </div>

      {/* 8. Chapter History timeline */}
      <div style={sectionStyle}>
        <span style={labelStyle}>History State Evolution</span>
        {history.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.77rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            No edits registered in outline state history
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {history.map(item => (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                  <span>Source: {item.source.toUpperCase()}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#e08e6d", marginTop: "0.15rem" }}>
                  {item.field.replace("_", " ").toUpperCase()} updated
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginTop: "0.15rem" }}>
                  Old: <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.35)" }}>{item.old_value || "Empty"}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#fff", marginTop: "0.1rem" }}>
                  New: <span style={{ color: "#4caf50" }}>{item.new_value || "Empty"}</span>
                </div>
                {item.change_reason && (
                  <div style={{ fontSize: "0.72rem", color: "#b9a6e3", fontStyle: "italic", marginTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.25rem" }}>
                    Reason: "{item.change_reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. Notes Area */}
      {chapter.notes && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Workspace Notes</span>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontStyle: "italic", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
            {chapter.notes}
          </p>
        </div>
      )}

      {/* 10. Jump to Manuscript Button */}
      <button
        onClick={() => onOpenManuscript(chapter.id)}
        style={{ marginTop: "1rem", flexShrink: 0, background: "linear-gradient(90deg, #9f8ad0, #e08e6d)", border: "none", color: "#fff", padding: "0.85rem", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "0.88rem", boxShadow: "0 4px 14px rgba(224,142,109,0.3)" }}
      >
        Open Manuscript →
      </button>
    </div>
  );
}
