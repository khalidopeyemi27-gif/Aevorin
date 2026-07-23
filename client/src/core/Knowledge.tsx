import React, { useState, useEffect, useRef } from "react";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { EntityRepository } from "../database/repositories/entityRepository";
import { PromptModal } from "../components/ui/PromptModal";

interface Entity {
  id: string;
  type: string;
  title: string;
  summary: string;
  metadata: Record<string, any>;
}

interface KnowledgeProps {
  projectId: string;
  entities: Entity[];
  onRefreshEntities: () => Promise<void>;
  triggerAction?: string | null;
  onClearTriggerAction?: () => void;
  project?: { id: string; name: string };
  category: "character" | "world" | "timeline" | "history" | "rules";
  onJumpToScene?: (sceneId: string) => void;
}

// ── Shared style tokens ─────────────────────────────────────────────────────
const FS: React.CSSProperties = { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "0.88rem", padding: "0.65rem 0.85rem", width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical" as any };
const LS: React.CSSProperties = { fontSize: "0.72rem", color: "rgba(255,255,255,0.38)", textTransform: "uppercase" as any, letterSpacing: "0.07em", fontWeight: 600, marginBottom: "0.3rem", display: "block" };
const ST: React.CSSProperties = { fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as any, letterSpacing: "0.1em", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", marginBottom: "1rem", marginTop: "0.5rem" };

const CTABS = [
  { id: "overview", label: "Overview" },
  { id: "mind", label: "Mind" },
  { id: "history", label: "History" },
  { id: "relationships", label: "Relationships" },
  { id: "arc", label: "Arc" },
  { id: "scenes", label: "Scenes" },
  { id: "snapshots", label: "Memory Timeline" },
  { id: "notes", label: "Notes" },
];

// ── FieldInput helper ────────────────────────────────────────────────────────
function FI({ lbl, fk, meta, onChange, rows = 2, ph }: {
  lbl: string; fk: string; meta: any;
  onChange: (k: string, v: string) => void; rows?: number; ph?: string;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <span style={LS}>{lbl}</span>
      {rows === 1
        ? <input style={{ ...FS, resize: undefined as any }} value={meta[fk] || ""} onChange={e => onChange(fk, e.target.value)} placeholder={ph || lbl} />
        : <textarea style={{ ...FS, minHeight: `${rows * 1.7}rem` }} value={meta[fk] || ""} onChange={e => onChange(fk, e.target.value)} placeholder={ph || lbl} />}
    </div>
  );
}

// ── TraitPills helper ────────────────────────────────────────────────────────
function TP({ lbl, fk, meta, onChange, pos = true }: {
  lbl: string; fk: string; meta: any;
  onChange: (k: string, v: string) => void; pos?: boolean;
}) {
  const items: string[] = (meta[fk] || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const [inp, setInp] = useState("");
  const add = () => { if (!inp.trim()) return; onChange(fk, [...items, inp.trim()].join(", ")); setInp(""); };
  const rm = (i: number) => onChange(fk, items.filter((_: any, j: number) => j !== i).join(", "));
  const col = pos ? "#34d399" : "#ef4444";
  const bg  = pos ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)";
  const bd  = pos ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)";
  return (
    <div style={{ marginBottom: "1rem" }}>
      <span style={LS}>{lbl}</span>
      <div style={{ display: "flex", flexWrap: "wrap" as any, gap: "0.4rem", marginBottom: "0.5rem" }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: bg, color: col, border: `1px solid ${bd}`, borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.8rem", fontWeight: 600 }}>
            {pos ? "+" : "\u2212"} {t}
            <button onClick={() => rm(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}>\u00d7</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input style={{ ...FS, resize: undefined as any, flex: 1 }} value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={`Add ${lbl.toLowerCase()}...`} />
        <button onClick={add} style={{ background: bg, border: "none", borderRadius: "8px", color: col, padding: "0 0.85rem", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>+</button>
      </div>
    </div>
  );
}

// ── Character Card ───────────────────────────────────────────────────────────
function CC({ entity, active, onClick }: { entity: Entity; active: boolean; onClick: () => void }) {
  const m = entity.metadata || {};
  return (
    <div onClick={onClick} style={{
      background: active ? "rgba(224,142,109,0.08)" : "rgba(255,255,255,0.025)",
      border: active ? "1px solid rgba(224,142,109,0.35)" : "1px solid rgba(255,255,255,0.06)",
      borderRadius: "14px", cursor: "pointer", overflow: "hidden",
      display: "flex", flexDirection: "column" as any,
    }}>
      <div style={{ height: "88px", background: "linear-gradient(135deg,#2a2a2a,#1a1a1a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.4rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {m.portrait || "\ud83e\uddd1"}
      </div>
      <div style={{ padding: "0.75rem 0.85rem", flex: 1 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: active ? "#e08e6d" : "#fff", lineHeight: 1.2, marginBottom: "0.15rem" }}>{entity.title}</div>
        {m.nickname && <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", marginBottom: "0.3rem", fontStyle: "italic" }}>{m.nickname}</div>}
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" as any, marginBottom: "0.35rem" }}>
          {m.role && <span style={{ fontSize: "0.62rem", background: "rgba(224,142,109,0.12)", color: "#e08e6d", borderRadius: "4px", padding: "0.1rem 0.35rem", fontWeight: 700 }}>{m.role}</span>}
          {m.charType && <span style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", borderRadius: "4px", padding: "0.1rem 0.35rem" }}>{m.charType}</span>}
        </div>
        {entity.summary && <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic", lineHeight: 1.4 }}>&ldquo;{entity.summary.substring(0, 50)}{entity.summary.length > 50 ? "..." : ""}&rdquo;</div>}
      </div>
    </div>
  );
}

// ── Character Workspace ──────────────────────────────────────────────────────
function CW({ entity, onClose, onSave, onDelete, projectId, entities, onJumpToScene }: {
  entity: Entity; onClose: () => void;
  onSave: (meta: any, title: string, summary: string) => Promise<void>;
  onDelete: () => Promise<void>;
  projectId: string;
  entities: Entity[];
  onJumpToScene?: (sceneId: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [title, setTitle] = useState(entity.title);
  const [summary, setSummary] = useState(entity.summary);
  const [meta, setMeta] = useState<any>({ ...entity.metadata });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setTitle(entity.title); setSummary(entity.summary); setMeta({ ...entity.metadata }); setTab("overview"); }, [entity.id]);
  const set = (k: string, v: string) => setMeta((m: any) => ({ ...m, [k]: v }));
  const save = async () => { setSaving(true); try { await onSave(meta, title, summary); } finally { setSaving(false); } };

  // Lifted relationships tab states & operations
  const [targetId, setTargetId] = useState("");
  const [oldState, setOldState] = useState("");
  const [newState, setNewState] = useState("");
  const [trigger, setTrigger] = useState("");
  const [posKey, setPosKey] = useState("001.001");
  const [milestones, setMilestones] = useState<any[]>([]);

  const loadMilestones = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/canon/relationships/replay?positionKey=999.999`);
      const data = await res.json();
      const filtered = data.filter((m: any) => m.characterA === entity.id || m.characterB === entity.id);
      setMilestones(filtered || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab === "relationships") {
      loadMilestones();
    }
  }, [entity.id, tab]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !newState.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/canon/relationships/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          characterA: entity.id,
          characterB: targetId,
          eventId: "manual",
          positionKey: posKey,
          oldRelationship: oldState || null,
          newRelationship: newState.trim(),
          reason: trigger || null
        })
      });

      if (!res.ok) throw new Error("Failed to add milestone");

      setTargetId("");
      setOldState("");
      setNewState("");
      setTrigger("");
      await loadMilestones();
    } catch (err) {
      console.error(err);
    }
  };

  // Lifted Memory Timeline tab states & operations
  const [resolvedState, setResolvedState] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingState, setLoadingState] = useState(false);
  const [scenesList, setScenesList] = useState<any[]>([]);
  const [chaptersList, setChaptersList] = useState<any[]>([]);

  const [patchField, setPatchField] = useState("");
  const [patchValue, setPatchValue] = useState("");
  const [patchPosKey, setPatchPosKey] = useState("001.001");

  const loadState = async () => {
    setLoadingState(true);
    try {
      const stateRes = await fetch(`/api/projects/${projectId}/canon/characters/${entity.id}/state?positionKey=999.999`);
      const stateData = await stateRes.json();
      setResolvedState(stateData);

      const deltasRes = await fetch(`/api/projects/${projectId}/canon/events`);
      const deltasData = await deltasRes.json();
      
      const chRes = await fetch(`/api/projects/${projectId}/chapters`);
      const chaptersData = await chRes.json();
      setChaptersList(chaptersData || []);

      const scRes = await fetch(`/api/projects/${projectId}/scenes`);
      const scenesData = await scRes.json();
      setScenesList(scenesData || []);

      const filtered = deltasData.filter((ev: any) => {
        const charMatches = ev.changes && ev.changes.some((ch: any) => ch.character_id === entity.id);
        const relMatches = ev.relationshipChanges && ev.relationshipChanges.some((rc: any) => rc.character_a === entity.id || rc.character_b === entity.id);
        return charMatches || relMatches;
      });
      setHistory(filtered || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    if (tab === "snapshots") {
      loadState();
    }
  }, [entity.id, tab]);

  const handleCommitPatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patchField.trim() || !patchValue.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/canon/characters/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: entity.id,
          eventId: "manual",
          positionKey: patchPosKey,
          field: patchField.trim(),
          oldValue: "",
          newValue: patchValue.trim()
        })
      });

      if (!res.ok) throw new Error("Failed to commit change log");

      setPatchField("");
      setPatchValue("");
      await loadState();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" as any, height: "100%", background: "#1e1e1e" }}>
      {/* Header */}
      <div style={{ padding: "1.1rem 1.5rem 0", background: "#242424", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.8rem" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.2rem", padding: 0 }}>\u2190</button>
          <span style={{ fontSize: "1rem" }}>{meta.portrait || "\ud83e\uddd1"}</span>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: "1.2rem", fontWeight: 700, fontFamily: "'Source Serif 4',Georgia,serif", outline: "none", padding: 0 }} />
          <button onClick={onDelete} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: "8px", padding: "0.35rem 0.65rem", fontSize: "0.77rem", cursor: "pointer" }}>Delete</button>
          <button onClick={save} disabled={saving} style={{ background: "#9f8ad0", border: "none", color: "#fff", borderRadius: "8px", padding: "0.35rem 0.9rem", fontSize: "0.77rem", fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
        </div>
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" as any }}>
          {CTABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid #e08e6d" : "2px solid transparent",
              color: tab === t.id ? "#e08e6d" : "rgba(255,255,255,0.38)",
              padding: "0.45rem 0.9rem", fontSize: "0.82rem",
              fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap" as any
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.4rem" }}>
        {tab === "overview" && <>
          <p style={ST}>Identity</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <FI lbl="Full Name" fk="fullName" meta={meta} onChange={set} rows={1} />
            <FI lbl="Nickname / Title" fk="nickname" meta={meta} onChange={set} rows={1} />
            <FI lbl="Role" fk="role" meta={meta} onChange={set} rows={1} ph="Protagonist / Antagonist..." />
            <FI lbl="Character Type" fk="charType" meta={meta} onChange={set} rows={1} ph="Hero, Villain, Mentor..." />
            <FI lbl="Age" fk="age" meta={meta} onChange={set} rows={1} />
            <FI lbl="Gender" fk="gender" meta={meta} onChange={set} rows={1} />
            <FI lbl="Species / Race" fk="species" meta={meta} onChange={set} rows={1} />
            <FI lbl="Status" fk="status" meta={meta} onChange={set} rows={1} ph="Alive / Deceased / Unknown" />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <span style={LS}>Logline / Character Quote</span>
            <textarea style={{ ...FS, minHeight: "2.8rem" }} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Protects others because he failed once before..." />
          </div>
          <p style={ST}>Appearance</p>
          <FI lbl="Physical Description" fk="appearance" meta={meta} onChange={set} rows={4} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <FI lbl="Height" fk="height" meta={meta} onChange={set} rows={1} />
            <FI lbl="Build" fk="build" meta={meta} onChange={set} rows={1} />
            <FI lbl="Hair" fk="hair" meta={meta} onChange={set} rows={1} />
            <FI lbl="Eyes" fk="eyes" meta={meta} onChange={set} rows={1} />
            <FI lbl="Clothing Style" fk="clothing" meta={meta} onChange={set} rows={1} />
            <FI lbl="Portrait Emoji" fk="portrait" meta={meta} onChange={set} rows={1} ph="\ud83e\uddd1" />
          </div>
          <FI lbl="Distinguishing Features" fk="distinguishing" meta={meta} onChange={set} rows={2} />
          <p style={ST}>Personality at a Glance</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <TP lbl="Strengths" fk="strengths" meta={meta} onChange={set} pos={true} />
            <TP lbl="Flaws" fk="flaws" meta={meta} onChange={set} pos={false} />
          </div>
          <p style={ST}>Quick Summary</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[{ lb: "Current Goal", fk: "goal", ph: "What do they want right now?" }, { lb: "Greatest Fear", fk: "greatestFear", ph: "What terrifies them most?" }].map(({ lb, fk, ph }) => (
              <div key={fk} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "0.85rem" }}>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as any, letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{lb}</div>
                <textarea style={{ ...FS, background: "transparent", border: "none", padding: 0, minHeight: "2.5rem" }} value={meta[fk] || ""} onChange={e => set(fk, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
        </>}
        {tab === "mind" && <>
          <p style={ST}>Core Traits</p>
          <FI lbl="Core Traits" fk="traits" meta={meta} onChange={set} rows={2} ph="Loyal, Stubborn, Brave..." />
          <FI lbl="Habits" fk="habits" meta={meta} onChange={set} rows={2} />
          <FI lbl="Values" fk="values" meta={meta} onChange={set} rows={2} />
          <FI lbl="Beliefs" fk="beliefs" meta={meta} onChange={set} rows={2} />
          <FI lbl="Personality Type (MBTI / Enneagram)" fk="personalityType" meta={meta} onChange={set} rows={1} />
          <p style={ST}>Psychology</p>
          <FI lbl="Greatest Desire" fk="greatestDesire" meta={meta} onChange={set} rows={2} />
          <FI lbl="Greatest Fear" fk="greatestFear" meta={meta} onChange={set} rows={2} />
          <FI lbl="Internal Conflict" fk="internalConflict" meta={meta} onChange={set} rows={3} />
          <FI lbl="Secret" fk="secret" meta={meta} onChange={set} rows={2} />
          <FI lbl="Trauma" fk="trauma" meta={meta} onChange={set} rows={3} />
          <FI lbl="Motivation" fk="motivation" meta={meta} onChange={set} rows={2} />
          <FI lbl="Moral Boundaries" fk="moralBoundaries" meta={meta} onChange={set} rows={2} ph="What lines would they never cross?" />
          <p style={ST}>Dialogue and Voice</p>
          <FI lbl="Speaking Style" fk="speakingStyle" meta={meta} onChange={set} rows={2} />
          <FI lbl="Vocabulary" fk="vocabulary" meta={meta} onChange={set} rows={1} ph="Formal, Slang, Archaic..." />
          <FI lbl="Catchphrases" fk="catchphrases" meta={meta} onChange={set} rows={2} />
          <FI lbl="Dialogue Examples" fk="dialogueExamples" meta={meta} onChange={set} rows={5} />
        </>}
        {tab === "history" && <>
          <p style={ST}>Background</p>
          <FI lbl="Birthplace" fk="birthplace" meta={meta} onChange={set} rows={1} />
          <FI lbl="Childhood" fk="childhood" meta={meta} onChange={set} rows={4} />
          <FI lbl="Family" fk="family" meta={meta} onChange={set} rows={3} />
          <FI lbl="Education" fk="education" meta={meta} onChange={set} rows={2} />
          <FI lbl="Previous Events" fk="previousEvents" meta={meta} onChange={set} rows={4} />
          <FI lbl="Life Timeline" fk="lifeTimeline" meta={meta} onChange={set} rows={6} ph="Age 5: ..." />
        </>}
        {tab === "relationships" && (() => {
          const otherCharacters = entities.filter(e => e.type === "character" && e.id !== entity.id);

          return (
            <div style={{ textAlign: "left" }}>
              <p style={ST}>Static Profile Notes</p>
              <FI lbl="Family Notes" fk="relFamily" meta={meta} onChange={set} rows={2} />
              <FI lbl="Friends / Allies Notes" fk="relFriends" meta={meta} onChange={set} rows={2} />
              <FI lbl="Enemies / Rivals Notes" fk="relEnemies" meta={meta} onChange={set} rows={2} />
              <FI lbl="Romance / Love Interest" fk="relRomance" meta={meta} onChange={set} rows={2} />

              <p style={ST}>Evolving Relationship Timeline</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem" }}>
                {/* Active relationships list */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#e08e6d", margin: "0 0 1rem 0" }}>Resolved Connections</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {milestones.map((m, i) => {
                      const other = entities.find(e => e.id === (m.characterA === entity.id ? m.characterB : m.characterA));
                      return (
                        <div key={i} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "6px", padding: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                            <strong>{other ? other.title : "Unknown Character"}</strong>
                            <span style={{ color: "#9f8ad0", fontWeight: "bold" }}>{m.newRelationship}</span>
                          </div>
                          {m.reason && (
                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.38)", fontStyle: "italic", marginTop: "0.15rem" }}>
                              Trigger: "{m.reason}"
                            </div>
                          )}
                          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", marginTop: "0.1rem" }}>Position: {m.positionKey}</div>
                        </div>
                      );
                    })}
                    {milestones.length === 0 && (
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", textAlign: "center", margin: "2rem 0" }}>No evolving milestones logged</p>
                    )}
                  </div>
                </div>

                {/* Form to commit milestone */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#e08e6d", margin: "0 0 1rem 0" }}>Log Evolution Milestone</h4>
                  <form onSubmit={handleAddMilestone} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Target Connection</label>
                      <select 
                        value={targetId} 
                        onChange={(e) => setTargetId(e.target.value)}
                        style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", width: "100%", fontSize: "0.82rem" }}
                      >
                        <option value="">-- Choose Character --</option>
                        {otherCharacters.map(char => (
                          <option key={char.id} value={char.id}>{char.title}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Old State</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Friends" 
                          value={oldState} 
                          onChange={(e) => setOldState(e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", width: "100%", fontSize: "0.82rem" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>New State</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Enemies" 
                          value={newState} 
                          onChange={(e) => setNewState(e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", width: "100%", fontSize: "0.82rem" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Position Key</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 005.002" 
                        value={posKey} 
                        onChange={(e) => setPosKey(e.target.value)}
                        style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", width: "100%", fontSize: "0.82rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>Trigger Event Summary</label>
                      <textarea 
                        placeholder="Detail the narrative scene milestone that triggered this relationship update..." 
                        value={trigger} 
                        onChange={(e) => setTrigger(e.target.value)}
                        rows={2}
                        style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", width: "100%", fontSize: "0.82rem", resize: "none" }}
                      />
                    </div>

                    <button type="submit" className="btn btn-secondary btn-sm" style={{ width: "100%", fontWeight: "bold" }}>Log Connection Update</button>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}
        {tab === "arc" && <>
          <p style={ST}>Character Arc</p>
          <FI lbl="Starting State" fk="arcStart" meta={meta} onChange={set} rows={3} ph="Who are they at the beginning?" />
          <FI lbl="Goal" fk="arcGoal" meta={meta} onChange={set} rows={2} />
          <FI lbl="Conflict" fk="arcConflict" meta={meta} onChange={set} rows={3} />
          <FI lbl="Turning Points" fk="arcTurningPoints" meta={meta} onChange={set} rows={4} ph="Key moments that change them..." />
          <FI lbl="Transformation" fk="arcTransformation" meta={meta} onChange={set} rows={3} ph="How do they change?" />
          <FI lbl="Ending State" fk="arcEnd" meta={meta} onChange={set} rows={3} ph="Who are they at the end?" />
          <p style={ST}>Role in Story</p>
          <FI lbl="Protagonist / Antagonist / Supporting" fk="roleType" meta={meta} onChange={set} rows={1} />
          <FI lbl="Narrative Purpose" fk="narrativePurpose" meta={meta} onChange={set} rows={2} />
          <FI lbl="First Appearance" fk="firstAppearance" meta={meta} onChange={set} rows={1} ph="Chapter / Scene name..." />
          <FI lbl="Important Scenes" fk="importantScenes" meta={meta} onChange={set} rows={3} />
          <FI lbl="Fate" fk="fate" meta={meta} onChange={set} rows={2} />
        </>}
        {tab === "scenes" && <>
          <p style={ST}>Skills and Abilities</p>
          <FI lbl="Skills" fk="skills" meta={meta} onChange={set} rows={3} />
          <FI lbl="Weapons" fk="weapons" meta={meta} onChange={set} rows={2} />
          <FI lbl="Powers / Magic" fk="powers" meta={meta} onChange={set} rows={3} />
          <FI lbl="Limitations" fk="limitations" meta={meta} onChange={set} rows={2} />
          <FI lbl="Weaknesses" fk="weaknesses" meta={meta} onChange={set} rows={2} />
        </>}
        {tab === "snapshots" && (() => {
          // Helper to map position key to matching scene
          const findSceneByPositionKey = (positionKey: string) => {
            return scenesList.find((sc) => {
              let chOrder = 0;
              if (sc.chapter_id) {
                const ch = chaptersList.find((c) => c.id === sc.chapter_id);
                if (ch) chOrder = ch.order_index;
              }
              const chIdx = String(chOrder).padStart(3, "0");
              const scIdx = String(sc.order_index || 0).padStart(3, "0");
              return `${chIdx}.${scIdx}` === positionKey;
            });
          };

          return (
            <div style={{ textAlign: "left" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                Memory Timeline & States
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
                {/* Left: Timeline Feed */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ fontSize: "0.95rem", color: "#e08e6d", margin: "0 0 1rem 0" }}>Narrative History Journey</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
                      {history.map((ev, i) => {
                        const matchedScene = findSceneByPositionKey(ev.position_key);
                        return (
                          <div key={i} style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                              <div>
                                <span style={{ fontSize: "0.68rem", background: "rgba(224,142,109,0.12)", color: "#e08e6d", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold", marginRight: "0.4rem" }}>Pos: {ev.position_key}</span>
                                <strong style={{ color: "#fff", fontSize: "0.85rem" }}>{ev.title}</strong>
                              </div>
                              {matchedScene && onJumpToScene && (
                                <button 
                                  onClick={() => onJumpToScene(matchedScene.id)}
                                  style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold", padding: 0 }}
                                >
                                  Jump to Scene →
                                </button>
                              )}
                            </div>
                            {ev.description && (
                              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{ev.description}</p>
                            )}
                            
                            {/* Children Changes List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.4rem", marginTop: "0.4rem" }}>
                              {ev.changes && ev.changes.filter((c: any) => c.character_id === entity.id).map((ch: any) => (
                                <div key={ch.id} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
                                  🔹 Change: <span style={{ color: "rgba(255,255,255,0.4)" }}>{ch.field}</span>: {ch.old_value && <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)" }}>{ch.old_value}</span>} → <strong style={{ color: "#e08e6d" }}>{ch.new_value}</strong>
                                </div>
                              ))}
                              {ev.relationshipChanges && ev.relationshipChanges.filter((rc: any) => rc.character_a === entity.id || rc.character_b === entity.id).map((rc: any) => {
                                const otherId = rc.character_a === entity.id ? rc.character_b : rc.character_a;
                                const otherChar = entities.find(ent => ent.id === otherId);
                                return (
                                  <div key={rc.id} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
                                    🤝 Relation: <strong style={{ color: "#9f8ad0" }}>{otherChar ? otherChar.title : "Unknown"}</strong>: {rc.old_relationship && <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)" }}>{rc.old_relationship}</span>} → <strong style={{ color: "#9f8ad0" }}>{rc.new_relationship}</strong> {rc.reason && <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)", marginLeft: "0.25rem" }}>("{rc.reason}")</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {history.length === 0 && (
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", textAlign: "center", margin: "3rem 0" }}>No story journey events logged yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Resolved State & Quick Log */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Resolved Active State */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1.25rem" }}>
                    <h4 style={{ fontSize: "0.95rem", color: "#e08e6d", margin: "0 0 1rem 0" }}>Resolved Active State</h4>
                    {loadingState ? (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Replaying timeline patches...</p>
                    ) : resolvedState && Object.keys(resolvedState).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.5rem", marginTop: "0.25rem" }}>
                          {Object.entries(resolvedState).map(([k, v]: any) => (
                            <React.Fragment key={k}>
                              <span style={{ color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{k.replace("_", " ")}:</span>
                              <strong style={{ color: "#fff" }}>{v}</strong>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>No active memory details recorded yet.</p>
                    )}
                  </div>

                  {/* Log Property Change */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1.25rem" }}>
                    <h4 style={{ fontSize: "0.95rem", color: "#e08e6d", margin: "0 0 1rem 0" }}>Log Property Change</h4>
                    <form onSubmit={handleCommitPatch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          placeholder="Position Key (e.g. 001.002)" 
                          value={patchPosKey} 
                          onChange={(e) => setPatchPosKey(e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", flex: 1, fontSize: "0.82rem" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          placeholder="Field (e.g. left_arm)" 
                          value={patchField} 
                          onChange={(e) => setPatchField(e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", flex: 1, fontSize: "0.82rem" }}
                        />
                        <input 
                          type="text" 
                          placeholder="Value (e.g. lost)" 
                          value={patchValue} 
                          onChange={(e) => setPatchValue(e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.4rem", flex: 1, fontSize: "0.82rem" }}
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-end" }}>Commit Change</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {tab === "notes" && <>
          <p style={ST}>Writer Notes</p>
          <FI lbl="Author Notes" fk="authorNotes" meta={meta} onChange={set} rows={5} />
          <FI lbl="Ideas and Future Changes" fk="ideas" meta={meta} onChange={set} rows={5} />
          <FI lbl="AI Context Notes" fk="aiContext" meta={meta} onChange={set} rows={4} ph="Context for AI tools..." />
        </>}
      </div>
    </div>
  );
}

export default function Knowledge({
  projectId,
  entities,
  onRefreshEntities,
  triggerAction,
  onClearTriggerAction,
  project,
  category,
  onJumpToScene
}: KnowledgeProps) {
  const activeTab = category;
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedWorldCategory, setSelectedWorldCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    confirmText?: string;
    onConfirm: (val: string) => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });

  useEffect(() => {
    setSelectedWorldCategory(null);
    setActiveEntityId(null);
  }, [category]);

  // Form State variables
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});
  const [intel, setIntel] = useState<{
    totalMentions: number;
    firstAppearance: { sceneId: string; sceneTitle: string; chapterId: string; chapterTitle: string; label: string } | null;
    connectedEntities: { id: string; title: string; type: string; weight: number }[];
  } | null>(null);

  const handleEntitySelect = async (entity: Entity) => {
    setActiveEntityId(entity.id);
    setEditTitle(entity.title);
    setEditSummary(entity.summary);
    setMetadataFields(entity.metadata || {});
    setIntel(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/entities/${entity.id}/intelligence`);
      if (res.ok) {
        const data = await res.json();
        setIntel(data);
      }
    } catch (e) {
      console.error("[Knowledge] Failed to fetch entity intelligence:", e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      // Define basic template metadata depending on active category
      let initialMeta: Record<string, any> = {};
      if (activeTab === "character") {
        initialMeta = { fullName: newTitle.trim(), nickname: "", role: "", charType: "", age: "", gender: "", species: "", status: "", portrait: "\ud83e\uddd1", appearance: "", height: "", build: "", hair: "", eyes: "", clothing: "", distinguishing: "", strengths: "", flaws: "", traits: "", motivation: "", goal: "", greatestFear: "" };
      } else if (activeTab === "world") {
        initialMeta = {
          subCategory: selectedWorldCategory || "places",
          ...(selectedWorldCategory === "places" && { geography: "", climate: "", landmarks: "", description: "" }),
          ...(selectedWorldCategory === "people" && { age: "", traits: "", faction: "", motivation: "", description: "" }),
          ...(selectedWorldCategory === "history" && { era: "", event: "", significance: "", description: "" }),
          ...(selectedWorldCategory === "rules" && { constraint: "", penalty: "", application: "", description: "" }),
          ...(selectedWorldCategory === "magic" && { system: "", source: "", cost: "", spells: "", description: "" })
        };
      } else if (activeTab === "timeline") {
        initialMeta = { date: "", event: "", description: "", impact: "" };
      } else if (activeTab === "history") {
        initialMeta = { era: "", event: "", significance: "", summary: "" };
      } else if (activeTab === "rules") {
        initialMeta = { constraint: "", penalty: "", description: "" };
      }

      // 1. Save directly to local Dexie IndexedDB (0ms Persistence + Sync Queue)
      const newEnt = await EntityRepository.createEntity({
        projectId,
        type: activeTab,
        title: newTitle.trim(),
        summary: "",
        metadataJson: JSON.stringify(initialMeta)
      });

      // 2. Background push to backend API
      try {
        await fetch(`/api/projects/${projectId}/entities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newEnt.id,
            type: activeTab,
            title: newTitle.trim(),
            summary: "",
            metadata: initialMeta
          }),
        });
      } catch (err) {
        console.warn("[Knowledge] Background API push queued for sync:", err);
      }

      setNewTitle("");
      await onRefreshEntities();
      handleEntitySelect({
        id: newEnt.id,
        type: newEnt.type,
        title: newEnt.title,
        summary: newEnt.summary || "",
        metadata: initialMeta
      });
    } catch (e) {
      console.error("[Knowledge] Error creating entity:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCharSave = async (meta: any, title: string, summary: string) => {
    if (!activeEntityId) return;
    const res = await fetch(`/api/projects/${projectId}/entities/${activeEntityId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, metadata: meta }),
    });
    if (!res.ok) throw new Error("Failed to save");
    await onRefreshEntities();
  };

  const handleUpdate = async () => {
    if (!activeEntityId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/entities/${activeEntityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          metadata: metadataFields
        }),
      });
      if (!res.ok) throw new Error("Failed to update entity");
      await onRefreshEntities();
      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeEntityId || !confirm("Are you sure you want to delete this profile?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/entities/${activeEntityId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete entity");
      setActiveEntityId(null);
      await onRefreshEntities();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle triggerAction events dispatched from Command Palette
  useEffect(() => {
    if (triggerAction === "create-character") {
      setPromptModal({
        isOpen: true,
        title: "New Character",
        subtitle: "Enter a name for your new character profile",
        placeholder: "e.g. Arin Thorne",
        confirmText: "Create Character",
        onConfirm: (title) => {
          setPromptModal((prev) => ({ ...prev, isOpen: false }));
          if (title.trim()) {
            (async () => {
              try {
                const meta = { age: "", appearance: "", traits: "", motivation: "" };
                const newEnt = await EntityRepository.createEntity({
                  projectId,
                  type: "character",
                  title: title.trim(),
                  summary: "",
                  metadataJson: JSON.stringify(meta)
                });
                await onRefreshEntities();
                handleEntitySelect({ ...newEnt, metadata: meta });
              } catch (e) {
                console.error(e);
              }
            })();
          }
        }
      });
      onClearTriggerAction?.();
    } else if (triggerAction === "create-location") {
      setPromptModal({
        isOpen: true,
        title: "New Location",
        subtitle: "Enter a name for your new world location",
        placeholder: "e.g. Whispering Citadel",
        confirmText: "Create Location",
        onConfirm: (title) => {
          setPromptModal((prev) => ({ ...prev, isOpen: false }));
          if (title.trim()) {
            (async () => {
              try {
                const meta = { geography: "", description: "", climate: "", history: "" };
                const newEnt = await EntityRepository.createEntity({
                  projectId,
                  type: "world",
                  title: title.trim(),
                  summary: "",
                  metadataJson: JSON.stringify(meta)
                });
                await onRefreshEntities();
                handleEntitySelect({ ...newEnt, metadata: meta });
              } catch (e) {
                console.error(e);
              }
            })();
          }
        }
      });
      onClearTriggerAction?.();
    } else if (triggerAction === "create-item") {
      setPromptModal({
        isOpen: true,
        title: "New Event / Item",
        subtitle: "Enter a title for this timeline event or artifact",
        placeholder: "e.g. The Great Eclipse",
        confirmText: "Create Item",
        onConfirm: (title) => {
          setPromptModal((prev) => ({ ...prev, isOpen: false }));
          if (title.trim()) {
            (async () => {
              try {
                const meta = { date: "", event: "", description: "", impact: "" };
                const newEnt = await EntityRepository.createEntity({
                  projectId,
                  type: "timeline",
                  title: title.trim(),
                  summary: "",
                  metadataJson: JSON.stringify(meta)
                });
                await onRefreshEntities();
                handleEntitySelect({ ...newEnt, metadata: meta });
              } catch (e) {
                console.error(e);
              }
            })();
          }
        }
      });
      onClearTriggerAction?.();
    }
  }, [triggerAction, projectId]);

  const filteredEntities = entities.filter(e => {
    const eType = (e.type || "").toLowerCase();
    const targetType = (activeTab || "").toLowerCase();
    if (eType !== targetType) return false;
    if (targetType === "world") {
      if (!selectedWorldCategory) return false;
      return (e.metadata?.subCategory || "").toLowerCase() === selectedWorldCategory.toLowerCase();
    }
    return true;
  });

  const activeEntity = entities.find(e => e.id === activeEntityId) || null;

  const cwRef = useRef<HTMLDivElement>(null);
  useSwipeGesture(cwRef, {
    threshold: 60,
    onSwipeLeft: () => {
      if (activeTab === "character" && activeEntityId) {
        const sorted = [...filteredEntities].sort((a,b) => (b.metadata?.importance || 50) - (a.metadata?.importance || 50));
        const idx = sorted.findIndex(e => e.id === activeEntityId);
        if (idx !== -1 && idx < sorted.length - 1) {
          handleEntitySelect(sorted[idx + 1]);
        }
      }
    },
    onSwipeRight: () => {
      if (activeTab === "character" && activeEntityId) {
        const sorted = [...filteredEntities].sort((a,b) => (b.metadata?.importance || 50) - (a.metadata?.importance || 50));
        const idx = sorted.findIndex(e => e.id === activeEntityId);
        if (idx > 0) {
          handleEntitySelect(sorted[idx - 1]);
        }
      }
    }
  });

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      {activeTab === "character" ? (
        <div key="tab-character" style={{ display: "flex", height: "100%", background: "#1e1e1e", color: "#fff" }}>
          {/* Left: card grid */}
          <aside style={{ width: activeEntityId ? "255px" : "100%", flexShrink: 0, borderRight: activeEntityId ? "1px solid rgba(255,255,255,0.06)" : "none", display: (activeEntityId && window.innerWidth < 768) ? "none" : "flex", flexDirection: "column" as any, height: "100%", background: "#1e1e1e", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" as any, letterSpacing: "0.1em", fontWeight: 600 }}>Story Room</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e08e6d", fontFamily: "'Source Serif 4',Georgia,serif" }}>Characters</div>
              </div>
              <button
                onClick={() => {
                  setPromptModal({
                    isOpen: true,
                    title: "New Character",
                    subtitle: "Enter a name for your new character profile",
                    placeholder: "e.g. Arin Thorne",
                    confirmText: "Create Character",
                    onConfirm: (t) => {
                      setPromptModal((prev) => ({ ...prev, isOpen: false }));
                      if (t.trim()) {
                        setNewTitle(t.trim());
                        setTimeout(() => (document.getElementById("char-submit-trigger") as HTMLButtonElement)?.click(), 50);
                      }
                    }
                  });
                }}
                style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#9f8ad0", border: "none", color: "#fff", fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(159,138,208,0.4)" }}
              >+</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "0.85rem" }}>
              {filteredEntities.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "3rem", color: "rgba(255,255,255,0.22)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.6rem" }}>🧑</div>
                  <p style={{ fontSize: "0.82rem" }}>No characters yet.</p>
                  <p style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>Tap + to add one.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: activeEntityId ? "1fr" : "1fr 1fr", gap: "0.6rem" }}>
                  {filteredEntities.map(entity => <CC key={entity.id} entity={entity} active={activeEntityId === entity.id} onClick={() => handleEntitySelect(entity)} />)}
                </div>
              )}
            </div>
            <form onSubmit={handleCreate} style={{ display: "none" }}>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <button type="submit" id="char-submit-trigger">Go</button>
            </form>
          </aside>
          {/* Right: Character Workspace */}
          {activeEntityId && activeEntity && (
            <div ref={cwRef} style={{ flex: 1, height: "100%", overflow: "hidden", minWidth: 0 }}>
              <CW 
                entity={activeEntity} 
                onClose={() => setActiveEntityId(null)} 
                onSave={handleCharSave} 
                onDelete={handleDelete} 
                projectId={projectId} 
                entities={entities} 
                onJumpToScene={onJumpToScene}
              />
            </div>
          )}
        </div>
      ) : (
        <div key={`tab-${activeTab}`} className="knowledge-workspace" style={{ background: "#2d2d2d", minHeight: "calc(100vh - 120px)", position: "relative", color: "#fff" }}>
      
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        
        {/* LEFT COLUMN: LIST VIEW */}
        <aside 
          style={{
            flex: activeEntityId ? "0 0 350px" : "1",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: (activeEntityId && window.innerWidth < 768) ? "none" : "flex",
            flexDirection: "column",
            height: "100%",
            background: "#2d2d2d"
          }}
          className="knowledge-sidebar-col"
        >
          {/* Header Area */}
          <div style={{
            padding: "1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {activeTab === "world" && selectedWorldCategory !== null && (
                <button
                  onClick={() => {
                    setSelectedWorldCategory(null);
                    setActiveEntityId(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e08e6d",
                    fontSize: "1.45rem",
                    cursor: "pointer",
                    padding: 0,
                    marginRight: "0.25rem",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Back to categories"
                >
                  ←
                </button>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", textAlign: "left" }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "1.4rem",
                  color: "#e08e6d",
                  fontFamily: "'Source Serif 4', 'Georgia', serif",
                  fontWeight: 700
                }}>
                  {activeTab === "world" && (
                    selectedWorldCategory === null ? "World" :
                    selectedWorldCategory === "places" ? "Places" :
                    selectedWorldCategory === "people" ? "People" :
                    selectedWorldCategory === "history" ? "History" :
                    selectedWorldCategory === "rules" ? "Rules" :
                    selectedWorldCategory === "magic" ? "Magic" : "World"
                  )}
                  {activeTab === "timeline" && "Timeline"}
                  {activeTab === "history" && "History"}
                  {activeTab === "rules" && "World Rules"}
                </h2>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.5px" }}>
                  {(project?.name || "AEVORIN").toUpperCase()}
                </span>
              </div>
            </div>
            {/* Header controls & Add button */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {(activeTab !== "world" || selectedWorldCategory !== null) && (
                <button
                  onClick={() => {
                    const promptName = activeTab === "world" ? (selectedWorldCategory || "world element") : activeTab;
                    setPromptModal({
                      isOpen: true,
                      title: `New ${promptName.slice(0, 1).toUpperCase() + promptName.slice(1)}`,
                      subtitle: `Enter a name for your new ${promptName}`,
                      placeholder: `e.g. ${promptName === 'places' ? 'Eldoria City' : 'Name'}`,
                      confirmText: "Create Profile",
                      onConfirm: (title) => {
                        setPromptModal((prev) => ({ ...prev, isOpen: false }));
                        if (title.trim()) {
                          setNewTitle(title.trim());
                          setTimeout(() => {
                            const submitBtn = document.getElementById("hidden-submit-trigger");
                            if (submitBtn) submitBtn.click();
                          }, 100);
                        }
                      }
                    });
                  }}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #9f8ad0, #b46cff)",
                    color: "#fff",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    boxShadow: "0 3px 10px rgba(180, 108, 255, 0.3)"
                  }}
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Cards List container */}
          <div style={{
            padding: "1.25rem",
            overflowY: "auto",
            flex: 1,
            paddingBottom: "30px"
          }}>
            {activeTab === "world" && selectedWorldCategory === null ? (
              /* Display the 5 world categories matching the encyclopedia grid template */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                {[
                  { id: "places", label: "Places", desc: "Geography & Landmarks", icon: "🗺️" },
                  { id: "people", label: "People", desc: "Characters & Factions", icon: "👥" },
                  { id: "history", label: "History", desc: "Epochs & Timelines", icon: "📜" },
                  { id: "rules", label: "Rules", desc: "World Laws & Constraints", icon: "⚖️" },
                  { id: "magic", label: "Magic", desc: "Magic Systems & Limits", icon: "🔮" }
                ].map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedWorldCategory(cat.id);
                      setActiveEntityId(null);
                    }}
                    style={{
                      background: "#3e3d3c",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "8px",
                      padding: "1.15rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      gridColumn: cat.id === "magic" ? "span 2" : "auto",
                      transition: "transform 0.15s ease",
                      textAlign: "center"
                    }}
                    className="story-bible-card"
                  >
                    <div style={{
                      width: "48px",
                      height: "48px",
                      background: "#343332",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.45rem",
                      color: "#e08e6d"
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                        {cat.label}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Display normal cards for active subcategory */
              <>
                {filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => handleEntitySelect(entity)}
                    style={{
                      background: activeEntityId === entity.id ? "rgba(255,255,255,0.04)" : "#3e3d3c",
                      border: activeEntityId === entity.id ? "1px solid #e08e6d" : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      cursor: "pointer",
                      transition: "transform 0.15s ease"
                    }}
                    className="story-bible-card"
                  >
                    {/* Left Avatar box */}
                    <div style={{
                      width: "48px",
                      height: "48px",
                      background: "#343332",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      color: "#e08e6d",
                      flexShrink: 0
                    }}>
                      {activeTab === "world" && (
                        selectedWorldCategory === "places" ? "🗺️" :
                        selectedWorldCategory === "people" ? "👥" :
                        selectedWorldCategory === "history" ? "📜" :
                        selectedWorldCategory === "rules" ? "⚖️" :
                        selectedWorldCategory === "magic" ? "🔮" : "📍"
                      )}
                      {activeTab === "timeline" && "⏳"}
                      {activeTab === "history" && "📜"}
                      {activeTab === "rules" && "📖"}
                    </div>
                    
                    {/* Title / Description */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", textAlign: "left" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                        {entity.title}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                        {entity.summary ? (entity.summary.substring(0, 40) + "...") : "Tap to add details"}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredEntities.length === 0 && (
                  <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
                    No world profiles added yet. Click "+ Add" to create one!
                  </div>
                )}
              </>
            )}
          </div>



          {/* Hidden form to wire click triggers to existing logic handler */}
          <form 
            onSubmit={handleCreate} 
            style={{ display: "none" }}
          >
            <input 
              type="text" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
            />
            <button type="submit" id="hidden-submit-trigger">Submit</button>
          </form>
        </aside>

        {/* RIGHT COLUMN: DETAIL VIEW */}
        <main 
          style={{
            flex: "1",
            display: activeEntityId ? "flex" : ((window.innerWidth < 768) ? "none" : "flex"),
            flexDirection: "column",
            height: "100%",
            background: "#2a2928"
          }}
          className="knowledge-detail-col"
        >
          {activeEntityId ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: "1.5rem", paddingBottom: "90px" }} className="entity-form">
              {/* Detail Header bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                {/* Mobile Back button */}
                <button
                  onClick={() => setActiveEntityId(null)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    padding: "0.5rem 0.85rem",
                    color: "#e08e6d",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 600,
                    minHeight: "40px",
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                >
                  ← Cards List
                </button>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "1.4rem",
                    fontWeight: "bold",
                    outline: "none",
                    padding: "0.2rem 0",
                    fontFamily: "'Source Serif 4', 'Georgia', serif"
                  }}
                />

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleDelete} disabled={loading}>Delete</button>
                  <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={loading}>Save Profile</button>
                </div>
              </div>

              {/* Logline Summary */}
              <div className="form-group" style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Brief Summary / Logline</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  style={{
                    background: "#343332",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "0.75rem",
                    fontSize: "0.95rem"
                  }}
                  placeholder={`e.g. Fictional role details...`}
                />
              </div>

              {/* Attributes notebook fields list */}
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  Attributes / Notebook
                </h3>
                {Object.entries(metadataFields).map(([key, value]) => (
                  <div key={key} className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ textTransform: "capitalize", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{key}</label>
                    <textarea
                      value={value || ""}
                      onChange={(e) => {
                        const updatedMeta = { ...metadataFields, [key]: e.target.value };
                        setMetadataFields(updatedMeta);
                      }}
                      style={{
                        background: "#343332",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "6px",
                        color: "#fff",
                        padding: "0.75rem",
                        fontSize: "0.92rem",
                        minHeight: "80px",
                        fontFamily: "var(--font-ui)"
                      }}
                      placeholder={`Enter details for ${key}...`}
                    />
                  </div>
                ))}
              </div>

              {/* Manuscript Intelligence section */}
              <div style={{
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                textAlign: "left"
              }}>
                <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", marginBottom: "1rem" }}>Manuscript Intelligence</h3>
                {intel ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.95rem" }}>
                    <div>
                      Total Mentions: <strong style={{ color: "#e08e6d" }}>{intel.totalMentions}</strong>
                    </div>
                    <div>
                      First Appearance: <strong>{intel.firstAppearance ? intel.firstAppearance.label : "Not mentioned in manuscript yet"}</strong>
                    </div>
                    {intel.connectedEntities.length > 0 && (
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "rgba(255,255,255,0.4)" }}>Co-occurring Profiles:</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {intel.connectedEntities.map((conn) => (
                            <span
                              key={conn.id}
                              style={{
                                background: "rgba(159, 138, 208, 0.15)",
                                color: "#9f8ad0",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                                border: "1px solid rgba(159, 138, 208, 0.3)"
                              }}
                            >
                              {conn.title} ({conn.weight} appearance{conn.weight === 1 ? "" : "s"})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic", fontSize: "0.85rem" }}>Loading analytics...</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "rgba(255,255,255,0.25)",
              padding: "2rem"
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>📂</span>
              <p>Select a card profile from the list to view or edit notebook details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )}

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        subtitle={promptModal.subtitle}
        placeholder={promptModal.placeholder}
        confirmText={promptModal.confirmText}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <style>{`
        @media (max-width: 767px) {
          .knowledge-sidebar-col {
            flex: 1 !important;
            border-right: none !important;
          }
        }
      `}</style>
    </>
  );
}
