import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useOutline } from "./hooks/useOutline";
import { useStoryTimeline } from "./hooks/useStoryTimeline";
import { StoryHeader } from "./components/dashboard/StoryHeader";
import { StoryPulse } from "./components/health/StoryHealthCard"; // Rebranded Story Pulse
import { ModeSwitcher } from "./components/switcher/ModeSwitcher";
import { BoardView } from "./components/board/BoardView";
import { TreeOutline } from "./components/tree/TreeOutline";
import { TimelineOutline } from "./components/timeline/TimelineOutline";
import { ChapterDetail } from "./components/detail/ChapterDetail";
import { AddChapterSheet } from "./components/creation/AddChapterSheet";
import type { Chapter, StoryDNA } from "./models/chapter";
import { fetchStoryDNA, saveStoryDNA } from "./services/storyApi";

interface StoryProps {
  projectId: string;
  projectName: string;
  scenes: any[];
  entities: any[];
  onOpenManuscript: (chapterId: string, sceneId?: string) => void;
}

export default function Story({ projectId, projectName, scenes, entities, onOpenManuscript }: StoryProps) {
  const [activeMode, setActiveMode] = useState<'board' | 'tree' | 'timeline'>("board");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<(Chapter & { change_reason?: string }) | null>(null);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  // Story DNA state
  const [dna, setDna] = useState<StoryDNA | null>(null);
  const [isDnaOpen, setIsDnaOpen] = useState(false);
  const [savingDna, setSavingDna] = useState(false);

  const {
    chapters,
    actGroups,
    loading,
    addChapter,
    updateChapterDetails,
    moveChapter
  } = useOutline(projectId);

  const { canonEvents, threads, links } = useStoryTimeline(projectId, chapters, scenes, pulseTrigger);

  const loadDna = async () => {
    try {
      const data = await fetchStoryDNA(projectId);
      setDna(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadDna();
    }
  }, [projectId]);

  const handleSaveDna = async (e: FormEvent) => {
    e.preventDefault();
    if (!dna) return;
    setSavingDna(true);
    try {
      await saveStoryDNA(projectId, dna);
      setIsDnaOpen(false);
      setPulseTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDna(false);
    }
  };

  const handleAddChapterSubmit = async (title: string, act: string, purpose: string, status: string) => {
    const created = await addChapter(title, act, purpose, status);
    setPulseTrigger(prev => prev + 1);
    return created;
  };

  const handleSelectActionAfterCreate = (action: 'write' | 'scenes' | 'stay', chapterId: string) => {
    setIsAddSheetOpen(false);
    if (action === "write" || action === "scenes") {
      onOpenManuscript(chapterId);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    await updateChapterDetails(editingChapter.id, {
      title: editingChapter.title,
      act: editingChapter.act,
      purpose: editingChapter.purpose,
      status: editingChapter.status,
      goal: editingChapter.goal,
      conflict: editingChapter.conflict,
      summary: editingChapter.summary,
      chapter_number: editingChapter.chapter_number,
      estimated_word_count: editingChapter.estimated_word_count,
      notes: editingChapter.notes,
      emotional_target: editingChapter.emotional_target,
      reader_effect: editingChapter.reader_effect,
      theme_focus: editingChapter.theme_focus,
      chapter_question: editingChapter.chapter_question,
      turning_point: editingChapter.turning_point,
      consequence: editingChapter.consequence,
      change_reason: editingChapter.change_reason || "",
      source: "manual"
    });

    setEditingChapter(null);
    setPulseTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "5rem", color: "rgba(255,255,255,0.4)" }}>
        Loading Outline command workspace...
      </div>
    );
  }

  if (selectedChapterId) {
    return (
      <ChapterDetail
        projectId={projectId}
        chapterId={selectedChapterId}
        chapters={chapters}
        onClose={() => setSelectedChapterId(null)}
        onOpenManuscript={(chId, scId) => {
          setSelectedChapterId(null);
          onOpenManuscript(chId, scId);
        }}
        onRefreshTrigger={() => setPulseTrigger(prev => prev + 1)}
      />
    );
  }

  const labelStyle = {
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as any,
    display: "block",
    marginBottom: "0.25rem"
  };

  const inputStyle = {
    width: "100%",
    background: "#2d2d2d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#fff",
    padding: "0.55rem 0.75rem",
    fontSize: "0.85rem",
    boxSizing: "border-box" as any
  };

  return (
    <div style={{ background: "#1a1a1a", minHeight: "100%", color: "#fff", display: "flex", flexDirection: "column", padding: "1.25rem", position: "relative" }}>
      
      {/* Top Header Card */}
      <StoryHeader
        projectName={projectName}
        chapters={chapters}
        scenes={scenes}
        entities={entities}
        timelineEventsCount={canonEvents.length}
      />

      {/* Expandable Story DNA Card */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "0.75rem" }}>
        <div
          onClick={() => setIsDnaOpen(!isDnaOpen)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#e08e6d" }}>
            📖 Story DNA {isDnaOpen ? "▲" : "▼"}
          </span>
          {dna?.theme && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
              Theme: {dna.theme.length > 25 ? `${dna.theme.slice(0, 25)}...` : dna.theme}
            </span>
          )}
        </div>

        {isDnaOpen && dna && (
          <form onSubmit={handleSaveDna} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <div>
              <label style={labelStyle}>Theme Focus (The core message)</label>
              <input
                type="text"
                value={dna.theme}
                onChange={e => setDna({ ...dna, theme: e.target.value })}
                placeholder="e.g. Freedom always has a cost"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={labelStyle}>Genre</label>
                <input
                  type="text"
                  value={dna.genre}
                  onChange={e => setDna({ ...dna, genre: e.target.value })}
                  placeholder="e.g. Mystery Thriller"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tone</label>
                <input
                  type="text"
                  value={dna.tone}
                  onChange={e => setDna({ ...dna, tone: e.target.value })}
                  placeholder="e.g. Dark, philosophical"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={labelStyle}>Core Question</label>
                <input
                  type="text"
                  value={dna.core_question}
                  onChange={e => setDna({ ...dna, core_question: e.target.value })}
                  placeholder="e.g. Can one escape their past?"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Reader Promise</label>
                <input
                  type="text"
                  value={dna.reader_promise}
                  onChange={e => setDna({ ...dna, reader_promise: e.target.value })}
                  placeholder="e.g. Heart-pounding payoff"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ending Emotional Feeling</label>
              <input
                type="text"
                value={dna.ending_feeling}
                onChange={e => setDna({ ...dna, ending_feeling: e.target.value })}
                placeholder="e.g. Bittersweet hope"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>World Rules</label>
              <textarea
                value={dna.world_rules}
                onChange={e => setDna({ ...dna, world_rules: e.target.value })}
                placeholder="Core physics, magical boundaries, or laws governing this story..."
                rows={2}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Main Character Arc Goal</label>
              <input
                type="text"
                value={dna.main_character_arc}
                onChange={e => setDna({ ...dna, main_character_arc: e.target.value })}
                placeholder="e.g. Sarah learns to trust others"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Central Conflict</label>
              <input
                type="text"
                value={dna.central_conflict}
                onChange={e => setDna({ ...dna, central_conflict: e.target.value })}
                placeholder="e.g. Rebels vs. Dictatorship"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={savingDna}
              style={{ background: "#e08e6d", border: "none", color: "#fff", padding: "0.55rem", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.82rem" }}
            >
              {savingDna ? "Saving..." : "Save Story DNA 🧬"}
            </button>
          </form>
        )}
      </div>

      {/* Story Pulse warnings dashboard */}
      <StoryPulse projectId={projectId} refreshTrigger={pulseTrigger} onRefreshTrigger={() => setPulseTrigger(prev => prev + 1)} />

      <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />

      <div style={{ flex: 1, paddingBottom: "6.5rem" }}>
        {activeMode === "board" && (
          <BoardView
            actGroups={actGroups}
            scenes={scenes}
            entities={entities}
            onMoveChapterUp={id => moveChapter(id, "up")}
            onMoveChapterDown={id => moveChapter(id, "down")}
            onEditChapter={setEditingChapter}
            onOpenChapter={setSelectedChapterId}
          />
        )}
        {activeMode === "tree" && (
          <TreeOutline
            chapters={chapters}
            scenes={scenes}
            onOpenChapterDetail={setSelectedChapterId}
            onOpenScene={(chId, scId) => onOpenManuscript(chId, scId)}
          />
        )}
        {activeMode === "timeline" && (
          <TimelineOutline
            chapters={chapters}
            scenes={scenes}
            threads={threads}
            links={links}
            onOpenChapterDetail={setSelectedChapterId}
          />
        )}
      </div>

      {/* FLOATING ACTION BUTTON (⊕) POSITIONED STACKED ABOVE AI FAB */}
      <button
        onClick={() => setIsAddSheetOpen(true)}
        title="Add Chapter or Scene"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "152px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e08e6d, #f59e0b)",
          border: "none",
          color: "#fff",
          fontSize: "1.8rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(224,142,109,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 950,
          transition: "transform 0.2s ease, box-shadow 0.2s ease"
        }}
      >
        ＋
      </button>

      {isAddSheetOpen && (
        <AddChapterSheet
          onClose={() => setIsAddSheetOpen(false)}
          onSubmit={handleAddChapterSubmit}
          onSelectAction={handleSelectActionAfterCreate}
        />
      )}

      {/* Edit Chapter Sheet */}
      {editingChapter && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, top: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#212121", width: "100%", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", boxSizing: "border-box" as any, maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
                Edit Chapter
              </h3>
              <button onClick={() => setEditingChapter(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.2rem", cursor: "pointer", padding: "0 0.5rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  required
                  value={editingChapter.title}
                  onChange={e => setEditingChapter({ ...editingChapter, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Act</label>
                  <select
                    value={editingChapter.act}
                    onChange={e => {
                      const mapping: { [key: string]: number } = { "Act I": 1, "Act II": 2, "Act III": 3 };
                      setEditingChapter({ ...editingChapter, act: e.target.value, act_index: mapping[e.target.value] || 1 });
                    }}
                    style={inputStyle}
                  >
                    <option value="Act I">Act I</option>
                    <option value="Act II">Act II</option>
                    <option value="Act III">Act III</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Chapter No.</label>
                  <input
                    type="number"
                    value={editingChapter.chapter_number}
                    onChange={e => setEditingChapter({ ...editingChapter, chapter_number: parseInt(e.target.value) || 1 })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>🎯 Goal</label>
                  <input
                    type="text"
                    value={editingChapter.goal || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, goal: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>⚔ Conflict</label>
                  <input
                    type="text"
                    value={editingChapter.conflict || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, conflict: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>🎭 Emotional Target</label>
                  <input
                    type="text"
                    value={editingChapter.emotional_target || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, emotional_target: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>🎬 Reader Effect</label>
                  <input
                    type="text"
                    value={editingChapter.reader_effect || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, reader_effect: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>🔑 Theme Focus</label>
                  <input
                    type="text"
                    value={editingChapter.theme_focus || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, theme_focus: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>❓ Chapter Question</label>
                  <input
                    type="text"
                    value={editingChapter.chapter_question || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, chapter_question: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>⚡ Turning Point</label>
                  <input
                    type="text"
                    value={editingChapter.turning_point || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, turning_point: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>🧬 Consequence</label>
                  <input
                    type="text"
                    value={editingChapter.consequence || ""}
                    onChange={e => setEditingChapter({ ...editingChapter, consequence: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Narrative Purpose</label>
                <textarea
                  value={editingChapter.purpose || ""}
                  onChange={e => setEditingChapter({ ...editingChapter, purpose: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Summary</label>
                <textarea
                  value={editingChapter.summary || ""}
                  onChange={e => setEditingChapter({ ...editingChapter, summary: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editingChapter.status}
                    onChange={e => setEditingChapter({ ...editingChapter, status: e.target.value as any })}
                    style={inputStyle}
                  >
                    <option value="draft">○ Draft</option>
                    <option value="writing">◐ Writing</option>
                    <option value="complete">● Complete</option>
                    <option value="review">△ Review</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Est. Word Count</label>
                  <input
                    type="number"
                    value={editingChapter.estimated_word_count}
                    onChange={e => setEditingChapter({ ...editingChapter, estimated_word_count: parseInt(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Workspace Notes</label>
                <textarea
                  value={editingChapter.notes || ""}
                  onChange={e => setEditingChapter({ ...editingChapter, notes: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* CHANGE REASON MEMORY evolved logs input */}
              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                <label style={{ ...labelStyle, color: "#b9a6e3", fontWeight: "bold" }}>Reason for Chapter Revision</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Changed chapter focus to increase pacing, added character Sarah..."
                  value={editingChapter.change_reason || ""}
                  onChange={e => setEditingChapter({ ...editingChapter, change_reason: e.target.value })}
                  style={{ ...inputStyle, borderColor: "rgba(185, 166, 227, 0.4)" }}
                />
              </div>

              <button
                type="submit"
                style={{ background: "#e08e6d", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", marginTop: "0.5rem" }}
              >
                Save Changes & Log History Evolution
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
