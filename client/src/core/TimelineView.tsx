import { apiUrl } from "../lib/api";
import React, { useState, useEffect } from "react";
import { useToast } from "../components/providers/ToastProvider";
import { useStoryRoom } from "./StoryRoom/StoryRoomContext";
import { PromptModal } from "../components/ui/PromptModal";

interface FocusedEntity {
  type: "character" | "thread" | "relationship" | "theme";
  id: string;
  name: string;
  color?: string;
  metadata?: {
    role?: string;
    arc?: string;
  };
}

interface CharacterChange {
  id: string;
  character_id: string;
  field: string;
  old_value: string | null;
  new_value: string;
}

interface CanonEvent {
  id: string;
  project_id: string;
  position_key: string;
  title: string;
  description: string;
  importance: 'major' | 'minor';
  status: 'draft' | 'confirmed';
  created_at: string;
  changes: CharacterChange[];
}

interface Entity {
  id: string;
  project_id: string;
  type: string;
  title: string;
  summary: string;
}

interface TimelineViewProps {
  projectId: string;
}

export default function TimelineView({ projectId }: TimelineViewProps) {
  const { showToast } = useToast();
  const {
    filters,
    setFilters,
    focusStack,
    setFocusStack,
    selectedPosition,
    setSelectedPosition,
    pushFocus,
    popFocus,
    clearFocus
  } = useStoryRoom();

  const [events, setEvents] = useState<CanonEvent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [relationshipChanges, setRelationshipChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapterIndex, setChapterIndex] = useState(1);
  const [sceneIndex, setSceneIndex] = useState(1);
  const [importance, setImportance] = useState<'major' | 'minor'>('major');
  const [eventStatus, setEventStatus] = useState<'draft' | 'confirmed'>('confirmed');
  const [changesList, setChangesList] = useState<{
    characterId: string;
    field: string;
    oldValue: string;
    newValue: string;
  }[]>([]);

  // Relationship Replay state
  const [activeRelationships, setActiveRelationships] = useState<any[]>([]);

  // Sidebar Tab and Health state
  const [rightSidebarTab, setRightSidebarTab] = useState<'explore' | 'events' | 'relationships' | 'health'>('explore');
  const [reports, setReports] = useState<any[]>([]);

  // Relationship Form State
  const [relCharA, setRelCharA] = useState("");
  const [relCharB, setRelCharB] = useState("");
  const [relNew, setRelNew] = useState("");
  const [relReason, setRelReason] = useState("");

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    confirmText?: string;
    onConfirm: (val: string) => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });

  useEffect(() => {
    fetchTimelineData();
  }, [projectId]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      // Fetch everything concurrently
      const [evRes, entRes, repRes, chRes, scRes, thRes, relRes] = await Promise.all([
        fetch(apiUrl(`/api/projects/${projectId}/canon/events`)),
        fetch(apiUrl(`/api/projects/${projectId}/entities`)),
        fetch(apiUrl(`/api/projects/${projectId}/canon/reports`)),
        fetch(apiUrl(`/api/projects/${projectId}/chapters`)),
        fetch(apiUrl(`/api/projects/${projectId}/scenes`)),
        fetch(apiUrl(`/api/projects/${projectId}/story-threads`)),
        fetch(apiUrl(`/api/projects/${projectId}/canon/relationships/changes`))
      ]);

      const [evData, entData, repData, chData, scData, thData, relData] = await Promise.all([
        evRes.json(),
        entRes.json(),
        repRes.json(),
        chRes.json(),
        scRes.json(),
        thRes.json(),
        relRes.json()
      ]);

      setEvents(evData || []);
      setEntities(entData || []);
      setReports(repData || []);
      setChapters(chData || []);
      setScenes(scData || []);
      setThreads(thData || []);
      setRelationshipChanges(relData || []);
      
      if (evData && evData.length > 0) {
        setSelectedPosition(evData[evData.length - 1].position_key);
      }
    } catch (e) {
      console.error(e);
      showToast("Unable to load timeline memory data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Replay relationships when selected position key changes
  useEffect(() => {
    if (selectedPosition) {
      fetch(apiUrl(`/api/projects/${projectId}/canon/relationships/replay?positionKey=${selectedPosition}`))
        .then(res => res.json())
        .then(data => setActiveRelationships(data || []))
        .catch(console.error);
    } else {
      setActiveRelationships([]);
    }
  }, [selectedPosition, projectId]);

  const handleAddChangeRow = () => {
    const chars = entities.filter(e => e.type === "character");
    setChangesList(prev => [
      ...prev,
      {
        characterId: chars.length > 0 ? chars[0].id : "",
        field: "",
        oldValue: "",
        newValue: ""
      }
    ]);
  };

  const handleRemoveChangeRow = (idx: number) => {
    setChangesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChangeRowValue = (idx: number, key: string, val: any) => {
    setChangesList(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build sortable alphanumeric position key (e.g. 002.004)
    const chIdx = String(chapterIndex).padStart(3, "0");
    const scIdx = String(sceneIndex).padStart(3, "0");
    const positionKey = `${chIdx}.${scIdx}`;

    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/canon/events`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionKey,
          title: title.trim(),
          description: description.trim(),
          importance,
          status: eventStatus,
          changes: changesList.filter(c => c.characterId && c.field && c.newValue)
        })
      });

      if (!res.ok) throw new Error("Failed to create canon event");

      showToast("Canon event recorded successfully", "success");
      setTitle("");
      setDescription("");
      setChangesList([]);
      await fetchTimelineData();
    } catch (e) {
      console.error(e);
      showToast("Unable to record canon event", "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will revert character property changes.")) return;
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/canon/events/${eventId}`), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete event");
      showToast("Event deleted", "success");
      await fetchTimelineData();
    } catch (e) {
      console.error(e);
      showToast("Unable to delete event", "error");
    }
  };

  const handleLogRelationshipChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relCharA || !relCharB || !relNew.trim()) return;

    const chIdx = String(chapterIndex).padStart(3, "0");
    const scIdx = String(sceneIndex).padStart(3, "0");
    const positionKey = `${chIdx}.${scIdx}`;

    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/canon/relationships/changes`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          characterA: relCharA,
          characterB: relCharB,
          chapter: chapterIndex,
          positionKey,
          newRelationship: relNew.trim(),
          reason: relReason.trim()
        })
      });

      if (!res.ok) throw new Error("Failed to log relationship transition");

      showToast("Relationship milestone saved", "success");
      setRelNew("");
      setRelReason("");
      await fetchTimelineData();
    } catch (e) {
      console.error(e);
      showToast("Unable to save relationship milestone", "error");
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/canon/reports/${reportId}/status`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      if (!res.ok) throw new Error("Failed to resolve continuity warning");
      showToast("Continuity report resolved", "success");
      const repRes = await fetch(apiUrl(`/api/projects/${projectId}/canon/reports`));
      const repData = await repRes.json();
      setReports(repData || []);
    } catch (e) {
      console.error(e);
      showToast("Unable to resolve report", "error");
    }
  };

  const handleIgnoreReport = async (reportId: string) => {
    setPromptModal({
      isOpen: true,
      title: "Ignore Contradiction Warning",
      subtitle: "Enter an optional reason for ignoring this continuity warning",
      placeholder: "e.g. Intentional plot twist",
      confirmText: "Ignore Warning",
      onConfirm: (reason) => {
        setPromptModal((prev) => ({ ...prev, isOpen: false }));
        (async () => {
          try {
            const res = await fetch(apiUrl(`/api/projects/${projectId}/canon/reports/${reportId}/status`), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "ignored", ignoredReason: reason })
            });
            if (!res.ok) throw new Error("Failed to ignore continuity warning");
            showToast("Continuity report marked as ignored", "success");
            const repRes = await fetch(apiUrl(`/api/projects/${projectId}/canon/reports`));
            const repData = await repRes.json();
            setReports(repData || []);
          } catch (e) {
            console.error(e);
            showToast("Unable to ignore report", "error");
          }
        })();
      }
    });
  };

  const getImportanceBadgeStyle = (imp: string) => {
    if (imp === "minor") {
      return { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" };
    }
    return { background: "rgba(224,142,109,0.12)", color: "#e08e6d", border: "1px solid rgba(224,142,109,0.3)" };
  };

  const getStatusBadgeStyle = (st: string) => {
    if (st === "draft") {
      return { background: "rgba(245, 197, 66, 0.12)", color: "#fbbf24", border: "1px solid rgba(245,197,66,0.3)" };
    }
    return { background: "rgba(52, 211, 153, 0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" };
  };
  const chars = entities.filter(e => e.type === "character");

  // Sort and build merged timeline feed items
  const buildTimelineFeed = () => {
    const activeFocus = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;

    // Helper to check if a chapter matches active focus
    const chapterMatchesFocus = (ch: any) => {
      if (!activeFocus) return true;
      const prefix = String(ch.chapter_number).padStart(3, "0");

      if (activeFocus.type === "theme") {
        return ch.theme_focus && ch.theme_focus.toLowerCase() === activeFocus.name.toLowerCase();
      }

      if (activeFocus.type === "thread") {
        const thread = threads.find(t => t.id === activeFocus.id);
        return thread?.chapters?.some((tc: any) => tc.chapter_id === ch.id);
      }

      if (activeFocus.type === "character") {
        const chEvents = events.filter(ev => ev.position_key.startsWith(prefix + "."));
        const hasCharChange = chEvents.some(ev => ev.changes?.some((c: any) => c.character_id === activeFocus.id));
        const hasRelChange = relationshipChanges.some(rc => 
          rc.position_key?.startsWith(prefix + ".") && 
          (rc.character_a === activeFocus.id || rc.character_b === activeFocus.id)
        );
        return hasCharChange || hasRelChange;
      }

      if (activeFocus.type === "relationship") {
        const [charA, charB] = activeFocus.id.split("_");
        return relationshipChanges.some(rc => 
          rc.position_key?.startsWith(prefix + ".") && 
          ((rc.character_a === charA && rc.character_b === charB) || 
           (rc.character_a === charB && rc.character_b === charA))
        );
      }

      return true;
    };

    // If chapters are filtered in, we build a grouped hierarchy
    if (filters.includes("chapters")) {
      const sortedChapters = [...chapters].sort((a, b) => {
        if (a.act_index !== b.act_index) return a.act_index - b.act_index;
        return a.order_index - b.order_index;
      });

      const filteredChapters = sortedChapters.filter(chapterMatchesFocus);

      return filteredChapters.map(ch => {
        const prefix = String(ch.chapter_number).padStart(3, "0");

        // 1. Nested scenes
        const chScenes = filters.includes("scenes")
          ? scenes.filter(s => s.chapter_id === ch.id)
          : [];

        // 2. Mapped events (world)
        let chEvents = filters.includes("world")
          ? events.filter(ev => ev.position_key.startsWith(prefix + "."))
          : [];

        if (activeFocus?.type === "character") {
          chEvents = chEvents.filter(ev => ev.changes?.some((c: any) => c.character_id === activeFocus.id));
        }

        // 3. Character Changes (derived from events)
        let chChanges = filters.includes("characters")
          ? chEvents.flatMap(ev => ev.changes || [])
          : [];

        if (activeFocus?.type === "character") {
          chChanges = chChanges.filter((c: any) => c.character_id === activeFocus.id);
        }

        // 4. Relationship Changes
        let chRels = filters.includes("relationships")
          ? relationshipChanges.filter(rc => rc.position_key?.startsWith(prefix + "."))
          : [];

        if (activeFocus?.type === "character") {
          chRels = chRels.filter(rc => rc.character_a === activeFocus.id || rc.character_b === activeFocus.id);
        } else if (activeFocus?.type === "relationship") {
          const [charA, charB] = activeFocus.id.split("_");
          chRels = chRels.filter(rc => 
            (rc.character_a === charA && rc.character_b === charB) || 
            (rc.character_a === charB && rc.character_b === charA)
          );
        }

        // 5. Mystery progress
        let chThreads = filters.includes("mysteries")
          ? threads.filter(t => t.chapters?.some((tc: any) => tc.chapter_id === ch.id))
          : [];

        if (activeFocus?.type === "thread") {
          chThreads = chThreads.filter(t => t.id === activeFocus.id);
        }

        return {
          id: ch.id,
          type: "chapter_group",
          chapter_number: ch.chapter_number,
          act: ch.act,
          title: ch.title,
          details: ch,
          scenes: chScenes,
          events: chEvents,
          characterChanges: chChanges,
          relationshipChanges: chRels,
          threads: chThreads
        };
      });
    }

    // Otherwise, we build a flat sorted timeline list of checked items
    const items: any[] = [];

    if (filters.includes("scenes") && !activeFocus) {
      scenes.forEach(s => {
        const ch = chapters.find(c => c.id === s.chapter_id);
        const prefix = ch ? String(ch.chapter_number).padStart(3, "0") : "001";
        const idx = String(s.order_index || 0).padStart(3, "0");
        items.push({
          id: s.id,
          type: "scene_flat",
          date: `${prefix}.${idx}`,
          title: `Scene: ${s.title || "Untitled"}`,
          description: s.goal ? `Goal: ${s.goal}` : ""
        });
      });
    }

    if (filters.includes("world")) {
      events.forEach(ev => {
        if (activeFocus?.type === "character") {
          const hasChar = ev.changes?.some((c: any) => c.character_id === activeFocus.id);
          if (!hasChar) return;
        } else if (activeFocus) {
          return;
        }

        items.push({
          id: ev.id,
          type: "event_flat",
          date: ev.position_key,
          title: ev.title,
          description: ev.description,
          importance: ev.importance,
          status: ev.status,
          changes: filters.includes("characters")
            ? (activeFocus?.type === "character" ? ev.changes?.filter((c: any) => c.character_id === activeFocus.id) : ev.changes)
            : []
        });
      });
    } else if (filters.includes("characters")) {
      events.forEach(ev => {
        if (ev.changes && ev.changes.length > 0) {
          ev.changes.forEach((ch: any, idx: number) => {
            if (activeFocus?.type === "character" && ch.character_id !== activeFocus.id) return;
            if (activeFocus && activeFocus.type !== "character") return;

            items.push({
              id: `${ev.id}_ch_${idx}`,
              type: "character_change_flat",
              date: ev.position_key,
              title: `Character Change: ${ch.entity}`,
              description: `${ch.field}: ${ch.old ? `${ch.old} → ` : ""}${ch.new}`
            });
          });
        }
      });
    }

    if (filters.includes("relationships")) {
      relationshipChanges.forEach(rc => {
        if (activeFocus?.type === "character") {
          if (rc.character_a !== activeFocus.id && rc.character_b !== activeFocus.id) return;
        } else if (activeFocus?.type === "relationship") {
          const [charA, charB] = activeFocus.id.split("_");
          const match = (rc.character_a === charA && rc.character_b === charB) || 
                        (rc.character_a === charB && rc.character_b === charA);
          if (!match) return;
        } else if (activeFocus) {
          return;
        }

        const charA = entities.find(e => e.id === rc.character_a);
        const charB = entities.find(e => e.id === rc.character_b);
        items.push({
          id: rc.id,
          type: "relationship_change_flat",
          date: rc.position_key || "001.000",
          title: `Relationship Milestone: ${charA ? charA.title : "A"} ↔ ${charB ? charB.title : "B"}`,
          description: `State: ${rc.new_relationship}. Reason: ${rc.reason || "None"}`
        });
      });
    }

    if (filters.includes("mysteries")) {
      threads.forEach(th => {
        if (activeFocus?.type === "thread" && th.id !== activeFocus.id) return;
        if (activeFocus && activeFocus.type !== "thread") return;

        if (th.chapters) {
          th.chapters.forEach((tc: any) => {
            const ch = chapters.find(c => c.id === tc.chapter_id);
            const prefix = ch ? String(ch.chapter_number).padStart(3, "0") : "001";
            items.push({
              id: `${th.id}_${tc.chapter_id}`,
              type: "thread_flat",
              date: `${prefix}.000.thread`,
              title: `Mystery Thread: ${th.name}`,
              description: `Role: ${tc.role.toUpperCase()} in Chapter ${ch ? ch.chapter_number : "?"}`
            });
          });
        }
      });
    }

    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  };

  const feedItems = buildTimelineFeed();

  const handlePushFocus = (entity: FocusedEntity) => {
    pushFocus(entity);
  };

  const renderFocusBanner = () => {
    if (focusStack.length === 0) return null;

    const activeFocus = focusStack[focusStack.length - 1];

    let statsText = "";
    if (activeFocus.type === "character") {
      const activeChapters = chapters.filter(ch => {
        const prefix = String(ch.chapter_number).padStart(3, "0");
        const chEvents = events.filter(ev => ev.position_key.startsWith(prefix + "."));
        const hasChar = chEvents.some(ev => ev.changes?.some((c: any) => c.character_id === activeFocus.id));
        const hasRel = relationshipChanges.some(rc => 
          rc.position_key?.startsWith(prefix + ".") && 
          (rc.character_a === activeFocus.id || rc.character_b === activeFocus.id)
        );
        return hasChar || hasRel;
      });
      const changesCount = events.flatMap(ev => ev.changes || []).filter((c: any) => c.character_id === activeFocus.id).length;
      statsText = `${activeChapters.length} Chapters Involved • ${changesCount} Emotional Changes`;
    } else if (activeFocus.type === "thread") {
      const activeChapters = chapters.filter(ch => {
        const thread = threads.find(t => t.id === activeFocus.id);
        return thread?.chapters?.some((tc: any) => tc.chapter_id === ch.id);
      });
      statsText = `${activeChapters.length} Chapters Mapped`;
    } else if (activeFocus.type === "theme") {
      const activeChapters = chapters.filter(ch => ch.theme_focus && ch.theme_focus.toLowerCase() === activeFocus.name.toLowerCase());
      statsText = `${activeChapters.length} Chapters Focusing on Theme`;
    } else if (activeFocus.type === "relationship") {
      const [charA, charB] = activeFocus.id.split("_");
      const activeChapters = chapters.filter(ch => {
        const prefix = String(ch.chapter_number).padStart(3, "0");
        return relationshipChanges.some(rc => 
          rc.position_key?.startsWith(prefix + ".") && 
          ((rc.character_a === charA && rc.character_b === charB) || 
           (rc.character_a === charB && rc.character_b === charA))
        );
      });
      statsText = `${activeChapters.length} Chapters with Updates`;
    }

    // Resolve all chronological points matching activeFocus
    const matchingPositions: string[] = [];
    events.forEach(ev => {
      let match = false;
      if (activeFocus.type === "character") {
        match = ev.changes?.some((c: any) => c.character_id === activeFocus.id) ||
                relationshipChanges.some(rc => rc.event_id === ev.id && (rc.character_a === activeFocus.id || rc.character_b === activeFocus.id));
      } else if (activeFocus.type === "thread") {
        const thread = threads.find(t => t.id === activeFocus.id);
        const prefix = ev.position_key.split(".")[0];
        const chNumber = parseInt(prefix, 10);
        const chapter = chapters.find(c => c.chapter_number === chNumber);
        match = thread?.chapters?.some((tc: any) => tc.chapter_id === chapter?.id);
      } else if (activeFocus.type === "theme") {
        const prefix = ev.position_key.split(".")[0];
        const chNumber = parseInt(prefix, 10);
        const chapter = chapters.find(c => c.chapter_number === chNumber);
        match = chapter?.theme_focus?.toLowerCase() === activeFocus.name.toLowerCase();
      } else if (activeFocus.type === "relationship") {
        const [cA, cB] = activeFocus.id.split("_");
        match = relationshipChanges.some(rc => rc.event_id === ev.id && ((rc.character_a === cA && rc.character_b === cB) || (rc.character_a === cB && rc.character_b === cA)));
      }
      if (match && !matchingPositions.includes(ev.position_key)) {
        matchingPositions.push(ev.position_key);
      }
    });

    // Sort positions
    matchingPositions.sort();

    // Find current index of selectedPosition
    const currentIndex = selectedPosition ? matchingPositions.indexOf(selectedPosition) : -1;

    return (
      <div 
        style={{ 
          background: "rgba(224, 142, 109, 0.08)", 
          border: "1px solid rgba(224, 142, 109, 0.25)", 
          borderRadius: "12px", 
          padding: "1rem 1.25rem", 
          marginBottom: "1.5rem",
          display: "flex", 
          flexDirection: "column",
          gap: "0.5rem"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
          <span 
            onClick={() => clearFocus()}
            style={{ cursor: "pointer", color: "#e08e6d", textDecoration: "underline" }}
          >
            Narrative Timeline
          </span>
          {focusStack.map((item, idx) => {
            const isLast = idx === focusStack.length - 1;
            return (
              <React.Fragment key={idx}>
                <span>&gt;</span>
                <span 
                  onClick={() => {
                    if (!isLast) {
                      setFocusStack(prev => prev.slice(0, idx + 1));
                    }
                  }}
                  style={{ 
                    cursor: isLast ? "default" : "pointer", 
                    color: isLast ? "#fff" : "#e08e6d", 
                    textDecoration: isLast ? "none" : "underline",
                    fontWeight: isLast ? "bold" : "normal"
                  }}
                >
                  {item.name}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>🔍</span>
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#fff", fontWeight: "bold" }}>
                Focus: {activeFocus.name}
              </h3>
              <span style={{ fontSize: "0.68rem", textTransform: "uppercase", background: "rgba(255,255,255,0.08)", padding: "0.15rem 0.45rem", borderRadius: "4px", color: "rgba(255,255,255,0.6)", fontWeight: "bold" }}>
                {activeFocus.type}
              </span>
            </div>
            {statsText && (
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                {statsText}
              </p>
            )}
          </div>

          <button
            onClick={() => popFocus()}
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              color: "#fff", 
              fontSize: "0.75rem", 
              padding: "0.3rem 0.65rem", 
              borderRadius: "6px", 
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✕ Back
          </button>
        </div>

        {/* Time Travel Controls */}
        {matchingPositions.length > 0 && (
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.6rem", 
              marginTop: "0.8rem", 
              borderTop: "1px solid rgba(255,255,255,0.06)", 
              paddingTop: "0.8rem",
              flexWrap: "wrap"
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>CHRONOLOGY JUMP:</span>
            
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                disabled={currentIndex <= 0}
                onClick={() => setSelectedPosition(matchingPositions[currentIndex - 1])}
                style={{ 
                  background: currentIndex <= 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", 
                  color: currentIndex <= 0 ? "rgba(255,255,255,0.2)" : "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  cursor: currentIndex <= 0 ? "default" : "pointer"
                }}
              >
                ◀ Prev
              </button>
              <button
                disabled={currentIndex === -1 || currentIndex >= matchingPositions.length - 1}
                onClick={() => {
                  if (currentIndex === -1) {
                    setSelectedPosition(matchingPositions[0]);
                  } else {
                    setSelectedPosition(matchingPositions[currentIndex + 1]);
                  }
                }}
                style={{ 
                  background: (currentIndex === -1 || currentIndex >= matchingPositions.length - 1) ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", 
                  color: (currentIndex === -1 || currentIndex >= matchingPositions.length - 1) ? "rgba(255,255,255,0.2)" : "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  cursor: (currentIndex === -1 || currentIndex >= matchingPositions.length - 1) ? "default" : "pointer"
                }}
              >
                Next ▶
              </button>
            </div>

            <select
              value={selectedPosition || ""}
              onChange={(e) => {
                if (e.target.value) setSelectedPosition(e.target.value);
              }}
              style={{
                background: "#2a2a2a",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "0.75rem",
                padding: "0.3rem 0.5rem",
                borderRadius: "6px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="" disabled>-- Fast Jumps --</option>
              <option value={matchingPositions[0]}>⏮ First Appearance</option>
              {matchingPositions.length > 2 && (
                <option value={matchingPositions[Math.floor(matchingPositions.length / 2)]}>⚡ Major Change</option>
              )}
              <option value={matchingPositions[matchingPositions.length - 1]}>⏭ Final Resolution</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderFeedItems = () => {
    if (feedItems.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: "2.5rem" }}>⏳</span>
          <h3 style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}>No Timeline Events Match Focus/Filters</h3>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Select checkboxes above or log milestones in the right panel to track changes.</p>
        </div>
      );
    }

    if (filters.includes("chapters")) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", paddingLeft: "1.5rem", borderLeft: "2px solid rgba(255,255,255,0.04)" }}>
          {feedItems.map((chGroup) => {
            return (
              <div key={chGroup.id} style={{ position: "relative" }}>
                {/* Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-31px",
                    top: "14px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#e08e6d",
                    border: "2px solid #1e1e1e",
                    boxShadow: "0 0 8px #e08e6d"
                  }}
                />

                <div
                  style={{
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                  }}
                >
                  {/* Chapter Header */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                        {chGroup.act || "Act I"} • Chapter {chGroup.chapter_number}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#fff", margin: "0.2rem 0 0.15rem 0", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {chGroup.title || "Untitled Chapter"}
                    </h4>
                  </div>

                  {/* Themes Focus */}
                  {filters.includes("themes") && chGroup.details.theme_focus && (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span 
                        onClick={() => handlePushFocus({
                          type: "theme",
                          id: `theme_${chGroup.details.theme_focus}`,
                          name: chGroup.details.theme_focus
                        })}
                        style={{ cursor: "pointer", textDecoration: "underline", fontSize: "0.72rem", color: "#b9a6e3", fontWeight: "bold" }}
                      >
                        🔑 Theme: {chGroup.details.theme_focus}
                      </span>
                    </div>
                  )}

                  {/* Writer Intent */}
                  {filters.includes("intent") && (chGroup.details.goal || chGroup.details.summary || chGroup.details.conflict) && (
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "0.6rem 0.75rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Writer Intent</div>
                      {chGroup.details.goal && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>🎯 <strong>Goal:</strong> {chGroup.details.goal}</div>}
                      {chGroup.details.summary && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>📝 <strong>Summary:</strong> {chGroup.details.summary}</div>}
                      {chGroup.details.conflict && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>⚡ <strong>Conflict:</strong> {chGroup.details.conflict}</div>}
                    </div>
                  )}

                  {/* Emotional Beats */}
                  {filters.includes("emotional") && (chGroup.details.emotional_target || chGroup.details.turning_point || chGroup.details.reader_effect || chGroup.details.consequence) && (
                    <div style={{ background: "rgba(224,142,109,0.02)", border: "1px solid rgba(224,142,109,0.06)", padding: "0.6rem 0.75rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(224,142,109,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Emotional Beats</div>
                      {chGroup.details.emotional_target && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>🎭 <strong>Target Emotion:</strong> {chGroup.details.emotional_target}</div>}
                      {chGroup.details.turning_point && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>🌀 <strong>Turning Point:</strong> {chGroup.details.turning_point}</div>}
                      {chGroup.details.reader_effect && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>👁️ <strong>Reader Effect:</strong> {chGroup.details.reader_effect}</div>}
                      {chGroup.details.consequence && <div style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)" }}>💥 <strong>Consequence:</strong> {chGroup.details.consequence}</div>}
                    </div>
                  )}

                  {/* Scenes list nested */}
                  {chGroup.scenes.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", paddingLeft: "0.6rem", borderLeft: "2px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scenes list</div>
                      {chGroup.scenes.map((s: any, sIdx: number) => (
                        <div key={s.id} style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.65)" }}>
                          <span style={{ color: "#e08e6d", fontWeight: "bold", marginRight: "0.35rem" }}>{sIdx + 1}.</span>
                          {s.title || "Untitled Scene"}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* World events logged under this chapter */}
                  {chGroup.events.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>World Events</div>
                      {chGroup.events.map((ev: any) => (
                        <div 
                          key={ev.id} 
                          onClick={(e) => { e.stopPropagation(); setSelectedPosition(ev.position_key); }}
                          style={{
                            background: selectedPosition === ev.position_key ? "rgba(224, 142, 109, 0.04)" : "rgba(255,255,255,0.02)",
                            border: selectedPosition === ev.position_key ? "1px solid rgba(224, 142, 109, 0.2)" : "1px solid rgba(255,255,255,0.04)",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                            <span style={{ fontSize: "0.78rem", fontWeight: "bold", color: "#fff" }}>{ev.title}</span>
                            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                              <span style={{ fontSize: "0.6rem", padding: "0.05rem 0.3rem", borderRadius: "3px", ...getImportanceBadgeStyle(ev.importance) }}>
                                {ev.importance}
                              </span>
                              <span style={{ fontSize: "0.6rem", padding: "0.05rem 0.3rem", borderRadius: "3px", ...getStatusBadgeStyle(ev.status) }}>
                                {ev.status}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "1.1rem", marginLeft: "0.35rem" }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          {ev.description && <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{ev.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Character Changes nested */}
                  {chGroup.characterChanges.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Character Changes</div>
                      {chGroup.characterChanges.map((ch: any, cIdx: number) => {
                        const ent = entities.find(e => e.id === ch.character_id);
                        return (
                          <div key={cIdx} style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)", background: "rgba(224,142,109,0.03)", padding: "0.35rem 0.5rem", borderRadius: "4px" }}>
                            <strong 
                              onClick={() => handlePushFocus({
                                type: "character",
                                id: ch.character_id,
                                name: ent ? ent.title : ch.entity
                              })}
                              style={{ cursor: "pointer", textDecoration: "underline", color: "#e08e6d" }}
                            >
                              {ent ? ent.title : ch.entity}
                            </strong> · {ch.field}: {ch.old && <span style={{ textDecoration: "line-through", opacity: 0.5, marginRight: "0.25rem" }}>{ch.old}</span>} → <span style={{ color: "#e08e6d" }}>{ch.new}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Relationship Changes nested */}
                  {chGroup.relationshipChanges.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Relationship Updates</div>
                      {chGroup.relationshipChanges.map((rc: any) => {
                        const charA = entities.find(e => e.id === rc.character_a);
                        const charB = entities.find(e => e.id === rc.character_b);
                        const pairingName = `${charA ? charA.title : "A"} ↔ ${charB ? charB.title : "B"}`;
                        return (
                          <div key={rc.id} style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.7)", background: "rgba(159,138,208,0.03)", padding: "0.35rem 0.5rem", borderRadius: "4px" }}>
                            <strong
                              onClick={() => handlePushFocus({
                                type: "relationship",
                                id: rc.character_a < rc.character_b ? `${rc.character_a}_${rc.character_b}` : `${rc.character_b}_${rc.character_a}`,
                                name: pairingName
                              })}
                              style={{ cursor: "pointer", textDecoration: "underline", color: "#9f8ad0" }}
                            >
                              {pairingName}
                            </strong>: <span style={{ color: "#9f8ad0", fontWeight: "bold" }}>{rc.new_relationship}</span> {rc.reason && <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>({rc.reason})</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Mystery Threads mapped */}
                  {chGroup.threads.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {chGroup.threads.map((th: any) => {
                        const mapping = th.chapters?.find((tc: any) => tc.chapter_id === chGroup.id);
                        return (
                          <span 
                            key={th.id} 
                            onClick={() => handlePushFocus({
                              type: "thread",
                              id: th.id,
                              name: th.name
                            })}
                            style={{ cursor: "pointer", textDecoration: "underline", fontSize: "0.65rem", background: "rgba(185,166,227,0.12)", color: "#b9a6e3", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}
                          >
                            🧵 {th.name}: {mapping?.role.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Flat sequence view if chapters filter is OFF
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative", paddingLeft: "1.5rem", borderLeft: "2px solid rgba(255,255,255,0.04)" }}>
        {feedItems.map((item, idx) => {
          const isSelected = selectedPosition === item.date;
          const isEvent = item.type === "event_flat";

          return (
            <div key={item.id || idx} style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "-31px",
                  top: "12px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: isEvent ? "#e08e6d" : "#9f8ad0",
                  border: "2px solid #1e1e1e"
                }}
              />

              <div
                onClick={() => { setSelectedPosition(item.date); }}
                style={{
                  background: isSelected ? "rgba(224, 142, 109, 0.04)" : "rgba(255,255,255,0.02)",
                  border: isSelected ? "1px solid rgba(224, 142, 109, 0.25)" : "1px solid rgba(255,255,255,0.04)",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", fontWeight: "bold" }}>{item.date}</span>
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.65rem", color: "#b9a6e3", textTransform: "uppercase", fontWeight: "bold" }}>{item.type.replace("_flat", "")}</span>
                    {isEvent && (
                      <>
                        <span style={{ fontSize: "0.65rem", padding: "0.05rem 0.3rem", borderRadius: "3px", ...getImportanceBadgeStyle(item.importance) }}>
                          {item.importance}
                        </span>
                        <span style={{ fontSize: "0.65rem", padding: "0.05rem 0.3rem", borderRadius: "3px", ...getStatusBadgeStyle(item.status) }}>
                          {item.status}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item.id); }}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "1.1rem", marginLeft: "0.35rem" }}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: "bold", color: "#fff", margin: 0 }}>{item.title}</h4>
                {item.description && <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.77rem", color: "rgba(255,255,255,0.55)" }}>{item.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="timeline-container">
      {/* Left Column: Timeline Feed */}
      <div className="timeline-feed-column">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.6rem", color: "#e08e6d", margin: 0 }}>Narrative Timeline</h2>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", margin: "0.2rem 0 0" }}>🧠 Meaning focus: Unified story room narrative intelligence archive</p>
          </div>
        </div>

        {/* Dynamic Focus Banner */}
        {renderFocusBanner()}

        {/* Filters Header Bar */}
        <div className="timeline-filters-bar">
          <details 
            className="timeline-filters-accordion"
            style={{ 
              width: "100%", 
              marginBottom: "1rem", 
              border: "1px solid rgba(255,255,255,0.06)", 
              borderRadius: "8px", 
              background: "rgba(0,0,0,0.15)"
            }}
          >
            <summary 
              style={{ 
                padding: "0.7rem 1rem", 
                fontSize: "0.85rem", 
                color: "rgba(255,255,255,0.8)", 
                fontWeight: 600, 
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              ⚙️ View Options & Filters ({filters.length} active)
            </summary>
            
            <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "rgba(255,255,255,0.4)", marginRight: "0.5rem" }}>PRESETS:</span>
                <button
                  onClick={() => setFilters(["chapters", "scenes"])}
                  style={{ background: "none", border: "1px solid rgba(224,142,109,0.3)", color: "#e08e6d", fontSize: "0.72rem", padding: "0.3rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Chapter Events Only
                </button>
                <button
                  onClick={() => setFilters(["chapters", "scenes", "characters", "relationships", "world", "mysteries", "themes", "intent", "emotional"])}
                  style={{ background: "none", border: "1px solid rgba(159,138,208,0.3)", color: "#9f8ad0", fontSize: "0.72rem", padding: "0.3rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Full Narrative Mode
                </button>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "0.72rem", fontWeight: "bold", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>CUSTOM FILTERS:</span>
                <div 
                  className="timeline-filters-checkboxes"
                  style={{ 
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem 1.25rem"
                  }}
                >
                  {[
                    { id: "chapters", label: "Chapters" },
                    { id: "scenes", label: "Scenes" },
                    { id: "characters", label: "Characters" },
                    { id: "relationships", label: "Relationships" },
                    { id: "world", label: "World" },
                    { id: "mysteries", label: "Mysteries" },
                    { id: "themes", label: "Themes" },
                    { id: "intent", label: "Writer Intent" },
                    { id: "emotional", label: "Emotional Beats" }
                  ].map(f => (
                    <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => [...prev, f.id]);
                          } else {
                            setFilters(prev => prev.filter(item => item !== f.id));
                          }
                        }}
                        style={{ accentColor: "#e08e6d" }}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Resolving universe memory...</p>
        ) : renderFeedItems()}
      </div>

      {/* Right Column: Log Event Form & Relationship Replay */}
      <div className="timeline-sidebar-column">
        
        {/* Sub-tab Selection */}
        <div style={{ display: "flex", gap: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.85rem", overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
          <button 
            onClick={() => setRightSidebarTab('explore')} 
            style={{
              flex: 1.1,
              background: rightSidebarTab === 'explore' ? "rgba(224,142,109,0.12)" : "none",
              border: rightSidebarTab === 'explore' ? "1px solid rgba(224,142,109,0.3)" : "1px solid transparent",
              color: rightSidebarTab === 'explore' ? "#e08e6d" : "rgba(255,255,255,0.45)",
              borderRadius: "6px", padding: "0.5rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: "bold"
            }}
          >
            🔍 Explore
          </button>
          <button 
            onClick={() => setRightSidebarTab('events')} 
            style={{
              flex: 1,
              background: rightSidebarTab === 'events' ? "rgba(224,142,109,0.12)" : "none",
              border: rightSidebarTab === 'events' ? "1px solid rgba(224,142,109,0.3)" : "1px solid transparent",
              color: rightSidebarTab === 'events' ? "#e08e6d" : "rgba(255,255,255,0.45)",
              borderRadius: "6px", padding: "0.5rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: "bold"
            }}
          >
            📝 Log
          </button>
          <button 
            onClick={() => setRightSidebarTab('relationships')} 
            style={{
              flex: 1,
              background: rightSidebarTab === 'relationships' ? "rgba(224,142,109,0.12)" : "none",
              border: rightSidebarTab === 'relationships' ? "1px solid rgba(224,142,109,0.3)" : "1px solid transparent",
              color: rightSidebarTab === 'relationships' ? "#e08e6d" : "rgba(255,255,255,0.45)",
              borderRadius: "6px", padding: "0.5rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: "bold"
            }}
          >
            🔗 Replay
          </button>
          <button 
            onClick={() => setRightSidebarTab('health')} 
            style={{
              flex: 1,
              background: rightSidebarTab === 'health' ? "rgba(224,142,109,0.12)" : "none",
              border: rightSidebarTab === 'health' ? "1px solid rgba(224,142,109,0.3)" : "1px solid transparent",
              color: rightSidebarTab === 'health' ? "#e08e6d" : "rgba(255,255,255,0.45)",
              borderRadius: "6px", padding: "0.5rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: "bold"
            }}
          >
            🩺 Pulse
          </button>
        </div>

        {/* Tab 0: Explore */}
        {rightSidebarTab === 'explore' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "left" }}>
            
            {/* Characters Section */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center" }}>
                <span>👥 Characters Explorer</span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{chars.length}</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "150px", overflowY: "auto" }}>
                {chars.map(c => {
                  const activeChaptersCount = chapters.filter(ch => {
                    const prefix = String(ch.chapter_number).padStart(3, "0");
                    const chEvents = events.filter(ev => ev.position_key.startsWith(prefix + "."));
                    return chEvents.some(ev => ev.changes?.some((cc: any) => cc.character_id === c.id));
                  }).length;
                  
                  return (
                    <div 
                      key={c.id}
                      onClick={() => handlePushFocus({
                        type: "character",
                        id: c.id,
                        name: c.title
                      })}
                      style={{ 
                        background: "rgba(255,255,255,0.01)", 
                        border: "1px solid rgba(255,255,255,0.02)", 
                        borderRadius: "6px", 
                        padding: "0.4rem 0.6rem", 
                        cursor: "pointer", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center" 
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: "bold" }}>{c.title}</span>
                      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>{activeChaptersCount} Chs</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mystery Threads Section */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center" }}>
                <span>🧵 Mysteries & Threads</span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{threads.length}</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "150px", overflowY: "auto" }}>
                {threads.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => handlePushFocus({
                      type: "thread",
                      id: t.id,
                      name: t.name
                    })}
                    style={{ 
                      background: "rgba(255,255,255,0.01)", 
                      border: "1px solid rgba(255,255,255,0.02)", 
                      borderRadius: "6px", 
                      padding: "0.4rem 0.6rem", 
                      cursor: "pointer", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center" 
                    }}
                  >
                    <span style={{ fontSize: "0.82rem", color: "#b9a6e3", fontWeight: "bold" }}>{t.name}</span>
                    <span style={{ fontSize: "0.65rem", background: "rgba(185,166,227,0.1)", padding: "0.1rem 0.35rem", borderRadius: "4px", color: "#b9a6e3", textTransform: "uppercase" }}>{t.type.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Relationships Section */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center" }}>
                <span>🔗 Key Relationships</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "150px", overflowY: "auto" }}>
                {Array.from(new Set(relationshipChanges.map(rc => 
                  rc.character_a < rc.character_b ? `${rc.character_a}_${rc.character_b}` : `${rc.character_b}_${rc.character_a}`
                ))).map(pairId => {
                  const [charAId, charBId] = pairId.split("_");
                  const charA = entities.find(e => e.id === charAId);
                  const charB = entities.find(e => e.id === charBId);
                  const relEventsCount = relationshipChanges.filter(rc => 
                    (rc.character_a === charAId && rc.character_b === charBId) ||
                    (rc.character_a === charBId && rc.character_b === charAId)
                  ).length;

                  return (
                    <div 
                      key={pairId}
                      onClick={() => handlePushFocus({
                        type: "relationship",
                        id: pairId,
                        name: `${charA?.title || "A"} ↔ ${charB?.title || "B"}`
                      })}
                      style={{ 
                        background: "rgba(255,255,255,0.01)", 
                        border: "1px solid rgba(255,255,255,0.02)", 
                        borderRadius: "6px", 
                        padding: "0.4rem 0.6rem", 
                        cursor: "pointer", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center" 
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", color: "#fff", fontWeight: "bold" }}>
                        {charA?.title || "A"} ↔ {charB?.title || "B"}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
                        {relEventsCount} updates
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Themes Section */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center" }}>
                <span>🔑 Book Themes</span>
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {Array.from(new Set(chapters.map(ch => ch.theme_focus).filter(Boolean))).map((theme: any) => (
                  <span 
                    key={theme}
                    onClick={() => handlePushFocus({
                      type: "theme",
                      id: `theme_${theme}`,
                      name: theme
                    })}
                    style={{ 
                      fontSize: "0.72rem", 
                      background: "rgba(185,166,227,0.12)", 
                      color: "#b9a6e3", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "6px", 
                      cursor: "pointer", 
                      fontWeight: "bold",
                      border: "1px solid rgba(185,166,227,0.2)"
                    }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 1: Log Timeline Event */}
        {rightSidebarTab === 'events' && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", margin: "0 0 1.25rem 0" }}>
              Log Event
            </h3>
            <form onSubmit={handleSubmitEvent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Chapter</label>
                  <input
                    type="number"
                    min={1}
                    value={chapterIndex}
                    onChange={(e) => setChapterIndex(Number(e.target.value))}
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Scene</label>
                  <input
                    type="number"
                    min={1}
                    value={sceneIndex}
                    onChange={(e) => setSceneIndex(Number(e.target.value))}
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Event Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Battle of Black Fortress" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Importance</label>
                <select
                  value={importance}
                  onChange={(e: any) => setImportance(e.target.value)}
                  style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%" }}
                >
                  <option value="major">Major Event</option>
                  <option value="minor">Minor Event</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Status</label>
                <select
                  value={eventStatus}
                  onChange={(e: any) => setEventStatus(e.target.value)}
                  style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%" }}
                >
                  <option value="confirmed">Confirmed Canon</option>
                  <option value="draft">Draft / Speculative</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Narrative Summary</label>
                <textarea 
                  placeholder="Summarize the action event consequences..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none", resize: "vertical" }}
                />
              </div>

              {/* Changes list section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold" }}>Character Changes</label>
                  <button 
                    type="button" 
                    onClick={handleAddChangeRow} 
                    style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold", padding: 0 }}
                  >
                    + Add Change
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {changesList.map((row, idx) => (
                    <div key={idx} style={{ background: "rgba(0,0,0,0.15)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>Change #{idx + 1}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveChangeRow(idx)} 
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
                        >
                          remove
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                        <select
                          value={row.characterId}
                          onChange={(e) => handleChangeRowValue(idx, "characterId", e.target.value)}
                          style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", padding: "0.35rem", width: "100%" }}
                        >
                          <option value="">-- Select Character --</option>
                          {chars.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input 
                            type="text" 
                            placeholder="field (e.g. left_arm)" 
                            value={row.field}
                            onChange={(e) => handleChangeRowValue(idx, "field", e.target.value)}
                            style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", padding: "0.35rem", width: "100%", fontSize: "0.8rem" }}
                          />
                          <input 
                            type="text" 
                            placeholder="new value (e.g. lost)" 
                            value={row.newValue}
                            onChange={(e) => handleChangeRowValue(idx, "newValue", e.target.value)}
                            style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", padding: "0.35rem", width: "100%", fontSize: "0.8rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "0.6rem", fontWeight: 700, borderRadius: "6px" }}
                disabled={!title.trim()}
              >
                Save Event & Changes
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Relationship Replay */}
        {rightSidebarTab === 'relationships' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.5rem", textAlign: "left" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", margin: "0 0 1rem 0" }}>
                Log Relationship Change
              </h3>
              <form onSubmit={handleLogRelationshipChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Character A</label>
                  <select
                    value={relCharA}
                    onChange={(e) => setRelCharA(e.target.value)}
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%" }}
                  >
                    <option value="">-- Select Character --</option>
                    {chars.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Character B</label>
                  <select
                    value={relCharB}
                    onChange={(e) => setRelCharB(e.target.value)}
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%" }}
                  >
                    <option value="">-- Select Character --</option>
                    {chars.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Chapter</label>
                    <input
                      type="number"
                      min={1}
                      value={chapterIndex}
                      onChange={(e) => setChapterIndex(Number(e.target.value))}
                      style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Scene</label>
                    <input
                      type="number"
                      min={1}
                      value={sceneIndex}
                      onChange={(e) => setSceneIndex(Number(e.target.value))}
                      style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>New Relationship State</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rivals, Allies, Enemies" 
                    value={relNew} 
                    onChange={(e) => setRelNew(e.target.value)} 
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Reason / Trigger Event</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Betrayal at Northern Gate" 
                    value={relReason} 
                    onChange={(e) => setRelReason(e.target.value)} 
                    style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", padding: "0.5rem", width: "100%", outline: "none" }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!relCharA || !relCharB || !relNew.trim()}
                  style={{ width: "100%", padding: "0.6rem", fontWeight: 700, borderRadius: "6px" }}
                >
                  Save Milestone
                </button>
              </form>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.5rem", textAlign: "left" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", margin: "0 0 1rem 0" }}>
                Relationship Replay
              </h3>
              {selectedPosition ? (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.75rem" }}>
                    Active status network replayed up to position <strong>{selectedPosition}</strong>:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {activeRelationships.map((r, i) => {
                      const s = entities.find(e => e.id === r.characterA);
                      const t = entities.find(e => e.id === r.characterB);
                      return (
                        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                            <strong>{s ? s.title : "Unknown"}</strong>
                            <span style={{ color: "#9f8ad0", fontWeight: "bold" }}>{r.newRelationship}</span>
                            <strong>{t ? t.title : "Unknown"}</strong>
                          </div>
                          {r.reason && (
                            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", fontStyle: "italic", marginTop: "0.2rem" }}>
                              Trigger: "{r.reason}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {activeRelationships.length === 0 && (
                      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "1rem 0" }}>No active relationships resolved at this point.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "1rem 0" }}>Select an event on the timeline to replay relationships.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Canon Health Diagnostics */}
        {rightSidebarTab === 'health' && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "12px", padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#e08e6d", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem", margin: "0 0 1rem 0" }}>
              Diagnostics Dashboard
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {reports.map((rep) => (
                <div 
                  key={rep.id} 
                  style={{
                    background: rep.severity === "critical" ? "rgba(239, 68, 68, 0.05)" : "rgba(245, 197, 66, 0.05)",
                    border: rep.severity === "critical" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(245,197,66,0.2)",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    fontSize: "0.85rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                    <strong style={{ color: rep.severity === "critical" ? "#f87171" : "#fbbf24", textTransform: "capitalize", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                      ⚠️ {rep.severity} · {rep.type} {(() => {
                        const c = rep.confidence !== undefined ? rep.confidence : 1.0;
                        const label = c >= 0.9 ? "High confidence" : c >= 0.7 ? "Medium confidence" : "Low confidence";
                        return `(${label})`;
                      })()}
                    </strong>
                    <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                      <button 
                        onClick={() => handleResolveReport(rep.id)}
                        style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.72rem", fontWeight: "bold", padding: 0 }}
                      >
                        Resolve
                      </button>
                      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.72rem" }}>|</span>
                      <button 
                        onClick={() => handleIgnoreReport(rep.id)}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.72rem", fontWeight: "bold", padding: 0 }}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                  <div style={{ color: "#fff", fontWeight: 500, marginBottom: "0.25rem" }}>{rep.message}</div>
                  {rep.affected_character && (
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>Character: {rep.affected_character}</div>
                  )}
                  {rep.evidence && (
                    <blockquote style={{ margin: "0.4rem 0 0 0", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", fontStyle: "italic", fontSize: "0.78rem" }}>
                      "{rep.evidence}"
                    </blockquote>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "rgba(255,255,255,0.35)" }}>
                  <span style={{ fontSize: "2rem" }}>✅</span>
                  <h4 style={{ marginTop: "0.5rem" }}>Story Canon is Healthy</h4>
                  <p style={{ fontSize: "0.75rem" }}>No consistency contradictions detected across chapters.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        subtitle={promptModal.subtitle}
        placeholder={promptModal.placeholder}
        confirmText={promptModal.confirmText}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
