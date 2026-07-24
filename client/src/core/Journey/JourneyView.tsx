import React, { useState, useEffect } from "react";
import { apiUrl } from "../../lib/api";
import { useStoryRoom } from "../StoryRoom/StoryRoomContext";
import { useBackHandler } from "../navigation/useBackHandler";
import { BACK_PRIORITY } from "../navigation/BackPriority";

interface JourneyViewProps {
  projectId: string;
}

interface ArcEvent {
  id: string;
  character_id: string;
  chapter_id: string | null;
  event_type: string;
  emotional_state: string;
  motivation: string;
  belief_change: string;
  relationship_change: string;
  importance: number;
  location_id: string | null;
  trigger_event: string;
  chapter_number: number | null;
  chapter_title: string | null;
  act: string | null;
}

export default function JourneyView({ projectId }: JourneyViewProps) {
  const { focusStack, pushFocus } = useStoryRoom();
  
  const [characters, setCharacters] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [arcs, setArcs] = useState<ArcEvent[]>([]);
  
  // Loading and forms state
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogForm, setShowLogForm] = useState<boolean>(false);
  
  // Log arc event form fields
  const [chapterId, setChapterId] = useState<string>("");
  const [eventType, setEventType] = useState<string>("Motivation Shift");
  const [emotionalState, setEmotionalState] = useState<string>("");
  const [motivation, setMotivation] = useState<string>("");
  const [beliefChange, setBeliefChange] = useState<string>("");
  const [relationshipChange, setRelationshipChange] = useState<string>("");
  const [triggerEvent, setTriggerEvent] = useState<string>("");
  const [importance, setImportance] = useState<number>(50);

  // Sync with activeFocus character if it changes on stack
  const activeFocus = focusStack.find(item => item.type === "character");

  // Fetch characters and chapters list on mount
  useEffect(() => {
    Promise.all([
      fetch(apiUrl(`/api/projects/${projectId}/entities`)).then(res => res.json()),
      fetch(apiUrl(`/api/projects/${projectId}/chapters`)).then(res => res.json())
    ])
      .then(([entitiesData, chaptersData]) => {
        const chars = (entitiesData || []).filter((e: any) => e.type === "character");
        setCharacters(chars);
        setChapters(chaptersData || []);
        
        // Auto-select activeFocus character or default to first character
        if (activeFocus) {
          setSelectedCharId(activeFocus.id);
        } else if (chars.length > 0) {
          setSelectedCharId(chars[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [projectId]);

  // Sync selected character when activeFocus changes in context
  useEffect(() => {
    if (activeFocus && activeFocus.id !== selectedCharId) {
      setSelectedCharId(activeFocus.id);
    }
  }, [activeFocus]);

  // Fetch character arc events when selected character changes
  const fetchArcEvents = () => {
    if (!selectedCharId) return;
    fetch(apiUrl(`/api/projects/${projectId}/canon/characters/${selectedCharId}/arcs`))
      .then(res => res.json())
      .then(data => {
        setArcs(data || []);
      })
      .catch(err => console.error("Failed to load arcs:", err));
  };

  useEffect(() => {
    fetchArcEvents();
  }, [selectedCharId, projectId]);

  useBackHandler({
    id: "journey_log_form",
    priority: BACK_PRIORITY.JOURNEY_SELECTION,
    isActive: showLogForm,
    onBack: () => {
      setShowLogForm(false);
      return true;
    }
  });

  // Handle logging new milestone event
  const handleLogEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharId) return;

    fetch(apiUrl(`/api/projects/${projectId}/canon/characters/${selectedCharId}/arcs`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId: chapterId || null,
        eventType,
        emotionalState,
        motivation,
        beliefChange,
        relationshipChange,
        importance,
        triggerEvent
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to log arc event");
        return res.json();
      })
      .then(() => {
        // Reset form fields
        setChapterId("");
        setEmotionalState("");
        setMotivation("");
        setBeliefChange("");
        setRelationshipChange("");
        setTriggerEvent("");
        setImportance(50);
        setShowLogForm(false);
        fetchArcEvents(); // reload milestones
      })
      .catch(err => alert(err.message));
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "Motivation Shift": return "rgba(59, 130, 246, 0.15)"; // Blue
      case "Belief Crisis": return "rgba(239, 68, 68, 0.15)"; // Red
      case "Relationship Shift": return "rgba(168, 85, 247, 0.15)"; // Purple
      case "Traumatic Shock": return "rgba(245, 158, 11, 0.15)"; // Orange
      case "Climax Resolution": return "rgba(16, 185, 129, 0.15)"; // Green
      default: return "rgba(255, 255, 255, 0.08)";
    }
  };

  const getEventTextColor = (type: string) => {
    switch (type) {
      case "Motivation Shift": return "#60a5fa";
      case "Belief Crisis": return "#f87171";
      case "Relationship Shift": return "#c084fc";
      case "Traumatic Shock": return "#fb923c";
      case "Climax Resolution": return "#34d399";
      default: return "rgba(255,255,255,0.7)";
    }
  };

  const safeCharacters = Array.isArray(characters) ? characters : [];
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const safeArcs = Array.isArray(arcs) ? arcs : [];

  const selectedChar = safeCharacters.find(c => c.id === selectedCharId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", backgroundColor: "#0c101d", overflowY: "auto", padding: "1.5rem" }}>
      
      {/* Selector Header panel */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>👤</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>CHARACTER FOCUS:</span>
            <select
              value={selectedCharId}
              onChange={(e) => {
                setSelectedCharId(e.target.value);
                const char = safeCharacters.find(c => c.id === e.target.value);
                if (char) {
                  pushFocus({ id: char.id, type: "character", name: char.title });
                }
              }}
              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.88rem", padding: "0.25rem 0.6rem", borderRadius: "6px", outline: "none", cursor: "pointer", fontWeight: "bold", marginTop: "0.2rem" }}
            >
              {safeCharacters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
              {safeCharacters.length === 0 && <option value="" disabled>-- No Characters Found --</option>}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowLogForm(!showLogForm)}
          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
        >
          {showLogForm ? "✕ Close Form" : "➕ Log Arc Milestone"}
        </button>
      </div>

      {/* Log milestone Event Form (Collapsible card) */}
      {showLogForm && (
        <div style={{ background: "rgba(224, 142, 109, 0.04)", border: "1px solid rgba(224, 142, 109, 0.25)", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem", animation: "slideDown 0.2s ease-out" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "#fff" }}>Log Character Arc Milestone for {selectedChar?.title || "selected"}</h3>
          
          <form onSubmit={handleLogEvent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Chapter Link</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem" }}
              >
                <option value="">-- No Chapter Linkage (Backstory) --</option>
                {safeChapters.map(ch => (
                  <option key={ch.id} value={ch.id}>Chapter {ch.chapter_number}: {ch.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem" }}
              >
                <option value="Motivation Shift">Motivation Shift</option>
                <option value="Belief Crisis">Belief Crisis</option>
                <option value="Relationship Shift">Relationship Shift</option>
                <option value="Traumatic Shock">Traumatic Shock</option>
                <option value="Climax Resolution">Climax Resolution</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Emotional State (Aftermath)</label>
              <input
                type="text"
                placeholder="e.g. Broken, Determined, Conflicted"
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Significance / Importance ({importance})</label>
              <input
                type="range"
                min="10"
                max="100"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                style={{ accentColor: "#e08e6d", marginTop: "0.5rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>New Core Motivation</label>
              <textarea
                placeholder="What drives them forward now?"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem", minHeight: "45px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Core Belief / Attitude Shift</label>
              <textarea
                placeholder="What belief or view of the world did they change?"
                value={beliefChange}
                onChange={(e) => setBeliefChange(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem", minHeight: "45px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", gridColumn: "span 2" }}>
              <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Trigger / Catalyst (What Happened?)</label>
              <textarea
                placeholder="Describe the scene or revelation that triggered this change..."
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", padding: "0.4rem", fontSize: "0.8rem", minHeight: "55px" }}
              />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button 
                type="button" 
                onClick={() => setShowLogForm(false)} 
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ background: "#e08e6d", border: "none", color: "#fff", padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: "bold" }}
              >
                Save Milestone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Arcs Flowchart List */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Resolving narrative timeline...</p>
      ) : arcs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: "2rem" }}>📈</span>
          <h4 style={{ color: "rgba(255,255,255,0.7)", marginTop: "0.75rem" }}>No Arc Milestones Logged Yet</h4>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", margin: "0.3rem 0 1rem 0" }}>
            Track how {selectedChar?.title || "this character"} evolves emotionally, mentally, and motivationally throughout your novel.
          </p>
          <button
            onClick={() => setShowLogForm(true)}
            style={{ background: "rgba(224, 142, 109, 0.1)", border: "1px solid rgba(224, 142, 109, 0.3)", color: "#e08e6d", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", fontWeight: "bold" }}
          >
            Log First Milestone
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Emotional Arc Curve SVG */}
          <div style={{ padding: "1rem", background: "rgba(20, 24, 40, 0.4)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 1rem 0", fontSize: "0.85rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>Emotional Trajectory</h4>
            <svg width="100%" height="100" viewBox={`0 0 ${Math.max(safeArcs.length * 100, 300)} 100`} style={{ overflow: "visible" }}>
              <line x1="0" y1="50" x2="100%" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4,4" />
              <polyline
                fill="none"
                stroke="#e08e6d"
                strokeWidth="3"
                points={safeArcs.map((arc, i) => {
                  let val = 0;
                  if (arc.event_type === "Climax Resolution") val = 40;
                  else if (arc.event_type === "Motivation Shift") val = 20;
                  else if (arc.event_type === "Relationship Shift") val = 10;
                  else if (arc.event_type === "Belief Crisis") val = -20;
                  else if (arc.event_type === "Traumatic Shock") val = -40;
                  
                  return `${50 + i * 100},${50 - val}`;
                }).join(" ")}
                style={{ filter: "drop-shadow(0 4px 6px rgba(224, 142, 109, 0.4))" }}
              />
              {safeArcs.map((arc, i) => {
                let val = 0;
                if (arc.event_type === "Climax Resolution") val = 40;
                else if (arc.event_type === "Motivation Shift") val = 20;
                else if (arc.event_type === "Relationship Shift") val = 10;
                else if (arc.event_type === "Belief Crisis") val = -20;
                else if (arc.event_type === "Traumatic Shock") val = -40;

                return (
                  <g key={`node-${arc.id}`}>
                    <circle cx={50 + i * 100} cy={50 - val} r="6" fill="#0c101d" stroke={getEventTextColor(arc.event_type)} strokeWidth="2" />
                    <text x={50 + i * 100} y={50 - val - 12} fill="rgba(255,255,255,0.6)" fontSize="10" textAnchor="middle">
                      {arc.chapter_number ? `Ch ${arc.chapter_number}` : "Backstory"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "1.8rem" }}>
          
          {/* Vertical connecting line */}
          <div 
            style={{ 
              position: "absolute", 
              top: "0.5rem", 
              bottom: "0.5rem", 
              left: "8px", 
              width: "2px", 
              background: "linear-gradient(180deg, rgba(224, 142, 109, 0.6) 0%, rgba(159, 138, 208, 0.4) 100%)" 
            }} 
          />

          {safeArcs.map((arc) => {
            const badgeBg = getEventBadgeColor(arc.event_type);
            const textCol = getEventTextColor(arc.event_type);
            
            return (
              <div 
                key={arc.id}
                style={{ 
                  position: "relative", 
                  marginBottom: "1.5rem" 
                }}
              >
                {/* Flowchart Bullet Circle */}
                <div
                  style={{
                    position: "absolute",
                    left: "-1.8rem",
                    top: "0.4rem",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: textCol,
                    border: "2.5px solid #0c101d",
                    boxShadow: `0 0 8px ${textCol}`
                  }}
                />

                {/* Milestone Details Card */}
                <div
                  style={{
                    background: "rgba(20, 24, 40, 0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#fff" }}>
                        {arc.chapter_number !== null ? `Chapter ${arc.chapter_number}: ${arc.chapter_title}` : "Backstory / Prequel"}
                      </span>
                      {arc.act && (
                        <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "rgba(255,255,255,0.4)" }}>
                          {arc.act}
                        </span>
                      )}
                    </div>
                    
                    <span 
                      style={{ 
                        fontSize: "0.68rem", 
                        fontWeight: "bold", 
                        padding: "0.15rem 0.45rem", 
                        borderRadius: "5px", 
                        background: badgeBg, 
                        color: textCol 
                      }}
                    >
                      {arc.event_type}
                    </span>
                  </div>

                  {/* Trigger Catalyst */}
                  {arc.trigger_event && (
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineBreak: "anywhere", borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: "0.5rem", fontStyle: "italic" }}>
                      "{arc.trigger_event}"
                    </div>
                  )}

                  {/* Motivation and Belief rows */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.2rem", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "0.6rem" }}>
                    {arc.motivation && (
                      <div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", fontWeight: "bold" }}>CORE MOTIVATION:</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff", marginTop: "0.15rem", lineHeight: 1.3 }}>{arc.motivation}</div>
                      </div>
                    )}
                    {arc.belief_change && (
                      <div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", fontWeight: "bold" }}>BELIEF / WORLD VIEW SHIFT:</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff", marginTop: "0.15rem", lineHeight: 1.3 }}>{arc.belief_change}</div>
                      </div>
                    )}
                  </div>

                  {/* Emotional State Badge */}
                  {arc.emotional_state && (
                    <div style={{ display: "flex", justifySelf: "flex-start", alignItems: "center", gap: "0.3rem", marginTop: "0.1rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                      <span>🎭 Emotional State:</span>
                      <strong style={{ color: "#e08e6d" }}>{arc.emotional_state}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}
