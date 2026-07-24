import { apiUrl } from "../lib/api";
import React, { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "./store/WorkspaceStore";
import { useToast } from "../components/providers/ToastProvider";
import { usePreferences } from "./preferences/PreferencesContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import { CommandPalette } from "../components/workspace/CommandPalette";
import { SearchOverlay } from "../components/workspace/SearchOverlay";
import { Modal, Button, FAB, BottomSheet } from "../components/ui";
import { EntityRepository } from "../database/repositories/entityRepository";

function parseManuscriptLocally(content: string) {
  const lines = content.split(/\r?\n/);
  let chaptersCount = 0;
  let scenesCount = 0;
  let wordCount = 0;

  let currentSceneText = "";
  let hasMarkdownHeaders = false;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      hasMarkdownHeaders = true;
      chaptersCount++;
      if (currentSceneText.trim()) {
        scenesCount++;
        wordCount += currentSceneText.split(/\s+/).filter(Boolean).length;
      }
      currentSceneText = "";
    } else if (line.startsWith("## ")) {
      hasMarkdownHeaders = true;
      if (currentSceneText.trim()) {
        scenesCount++;
        wordCount += currentSceneText.split(/\s+/).filter(Boolean).length;
      }
      currentSceneText = "";
    } else {
      currentSceneText += line + "\n";
    }
  }

  if (currentSceneText.trim()) {
    scenesCount++;
    wordCount += currentSceneText.split(/\s+/).filter(Boolean).length;
  }

  if (!hasMarkdownHeaders) {
    chaptersCount = 1;
    scenesCount = 1;
    wordCount = content.split(/\s+/).filter(Boolean).length;
  }

  const estMins = Math.ceil(wordCount / 200);
  const estHours = Math.floor(estMins / 60);
  const remainingMins = estMins % 60;
  let readingTime = `${estMins} minute${estMins === 1 ? '' : 's'}`;
  if (estHours > 0) {
    readingTime = `${estHours} hour${estHours === 1 ? '' : 's'} ${remainingMins} minute${remainingMins === 1 ? '' : 's'}`;
  }

  return {
    chaptersCount,
    scenesCount,
    wordCount,
    readingTime
  };
}
import Overview from "./Overview";
import { StoryRoomProvider } from "./StoryRoom/StoryRoomContext";

const Manuscript = React.lazy(() => import("./Manuscript"));
const Story = React.lazy(() => import("./Story/Story"));
const Knowledge = React.lazy(() => import("./Knowledge"));
const TesterSurvey = React.lazy(() => import("./TesterSurvey"));
const TimelineView = React.lazy(() => import("./TimelineView"));
const StoryGraph = React.lazy(() => import("./StoryGraph/StoryGraph"));
const JourneyView = React.lazy(() => import("./Journey/JourneyView"));

function LoadingPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "var(--text-secondary)" }}>
      <div className="spinner" style={{ width: "30px", height: "30px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      <p style={{ marginTop: "1rem", fontSize: "0.8rem" }}>Loading panel...</p>
    </div>
  );
}

interface ProjectData {
  id: string;
  name: string;
  path: string;
  manifest: {
    created: string;
    writing_mode: string;
  };
  targetWordCount?: number;
  coverImage?: string | null;
  description?: string;
}

interface WorkspaceProps {
  project: ProjectData;
  onBackToDashboard: () => void;
  onSeedExample?: () => void;
  projects?: any[];
  onLoadProject?: (projectName: string) => Promise<void>;
}

interface AnalyticsData {
  totalWords: number;
  dialogueRatio: number;
  vocabularyDensity: number;
  topRepeatedWords: { word: string; count: number }[];
  povDistribution: { name: string; count: number }[];
  readability?: {
    score: number;
    label: string;
    sentenceCount: number;
    wordCount: number;
    syllableCount: number;
  };
  pacing?: {
    chapterId: string;
    chapterTitle: string;
    totalWords: number;
    sceneCount: number;
    averageSceneSize: number;
    shortestScene: { id: string; title: string; wordCount: number } | null;
    longestScene: { id: string; title: string; wordCount: number } | null;
    pacingVariance: number;
    flags: { sceneId: string; sceneTitle: string; type: string; message: string }[];
  }[];
}

interface BackupFile {
  fileName: string;
  created: string;
  sizeBytes: number;
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem" }}>
      <input type="checkbox" checked={done} readOnly style={{ width: "18px", height: "18px", accentColor: "#818cf8" }} />
      <span style={done ? { textDecoration: "line-through", color: "#64748b" } : {}}>{label}</span>
    </div>
  );
}

export default function Workspace({
  project,
  onBackToDashboard,
  onSeedExample,
  projects = [],
  onLoadProject
}: WorkspaceProps) {
  const {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    setSelectedProject,
    setSelectedChapterId,
    setSelectedSceneId,
    focusMode,
    setFocusMode
  } = useWorkspaceStore();

  const { showToast } = useToast();
  const { updatePreferences } = usePreferences();

  useEffect(() => {
    setSelectedProject(project);
  }, [project]);

  const [chapters, setChapters] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  
  // Exporter state
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [exportFormat, setExportFormat] = useState<"markdown" | "html" | "docx" | "epub">("markdown");
  const [exporting, setExporting] = useState(false);

  // Manuscript Compiler sub-panel state
  const [compilerSection, setCompilerSection] = useState<string | null>("chapter-ordering");
  const [compilerFontFamily, setCompilerFontFamily] = useState("Georgia");
  const [compilerFontSize, setCompilerFontSize] = useState("12");
  const [compilerLineSpacing, setCompilerLineSpacing] = useState("double");
  const [compilerIndent, setCompilerIndent] = useState(true);
  const [compilerSceneBreak, setCompilerSceneBreak] = useState("***");
  const [compilerChapterOrdering, setCompilerChapterOrdering] = useState<any[]>([]);
  const [frontMatter, setFrontMatter] = useState({ title: "", subtitle: "", author: "", dedication: "", includeToc: true, includeCopyright: true });
  const [backMatter, setBackMatter] = useState({ authorBio: "", acknowledgements: "", includeGlossary: false, includeIndex: false });
  const [consistencyIssues, setConsistencyIssues] = useState<{type:string; message:string; chapter:string}[]>([]);
  const [checkingConsistency, setCheckingConsistency] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Backups state
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  // Tester survey & Local usage insights state
  const [showSurvey, setShowSurvey] = useState(false);
  const [localInsights, setLocalInsights] = useState<any | null>(null);

  // Command Palette & Trigger Action state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    filename: string;
    content: string;
    chaptersCount: number;
    scenesCount: number;
    wordCount: number;
    readingTime: string;
  } | null>(null);
  const [triggerAction, setTriggerAction] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut Bindings
  useKeyboardShortcuts({
    onSave: () => {
      if (activeTab === "manuscript") {
        setTriggerAction("save-scene");
      }
    },
    onToggleFocus: () => {
      setFocusMode(!focusMode);
    },
    onCreateChapter: () => {
      setActiveTab("manuscript");
      setTriggerAction("create-chapter");
    },
    onOpenCommandPalette: () => {
      setShowCommandPalette(prev => !prev);
    },
    onOpenSearch: () => {
      setShowSearchOverlay(prev => !prev);
    }
  });

  const fetchLocalInsights = async () => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${project.id}/local-insights`));
      const data = await res.json();
      setLocalInsights(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChapters = async () => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${project.id}/chapters`));
      const data = await res.json();
      setChapters(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScenes = async () => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${project.id}/scenes`));
      const data = await res.json();
      setScenes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEntities = async () => {
    try {
      // 1. Fetch local IndexedDB entities
      const localEntities = await EntityRepository.getEntities(project.id);
      
      // 2. Fetch API entities
      let apiEntities: any[] = [];
      try {
        const res = await fetch(apiUrl(`/api/projects/${project.id}/entities`));
        if (res.ok) {
          apiEntities = await res.json();
        }
      } catch (e) {
        // API offline fallback is expected
      }

      // 3. Merge local & remote entities (local takes precedence)
      const map = new Map<string, any>();
      apiEntities.forEach(e => {
        if (e && e.id) {
          map.set(e.id, {
            ...e,
            type: (e.type || "character").toLowerCase(),
            metadata: e.metadata || {}
          });
        }
      });
      localEntities.forEach(e => {
        let parsedMeta = {};
        if (typeof e.metadataJson === "string") {
          try { parsedMeta = JSON.parse(e.metadataJson); } catch (err) {}
        } else if (e.metadataJson) {
          parsedMeta = e.metadataJson;
        }
        map.set(e.id, {
          id: e.id,
          type: (e.type || "character").toLowerCase(),
          title: e.title,
          summary: e.summary || "",
          metadata: parsedMeta
        });
      });

      setEntities(Array.from(map.values()));
    } catch (e) {
      console.error("[Workspace] Error fetching entities:", e);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(apiUrl(`/api/projects/${project.id}/analytics`));
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${project.id}/backups`));
      const data = await res.json();
      setBackups(data);
      if (data && data.length > 0) {
        localStorage.setItem(`aevorin_backup_created_${project.id}`, "true");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllWorkspaceData = async () => {
    setLoadingWorkspace(true);
    try {
      const resCh = await fetch(apiUrl(`/api/projects/${project.id}/chapters`));
      const chData = await resCh.json();
      setChapters(chData);

      const resSc = await fetch(apiUrl(`/api/projects/${project.id}/scenes`));
      const scData = await resSc.json();
      setScenes(scData);

      await fetchEntities();
      await fetchBackups();

      if (chData && chData.length === 1 && scData && scData.length === 1) {
        const isFirstWriteCached = localStorage.getItem(`aevorin_first_write_${project.id}`) === "true";
        if (!isFirstWriteCached) {
          setSelectedChapterId(chData[0].id);
          setSelectedSceneId(scData[0].id);
          setActiveTab("manuscript");
          localStorage.setItem(`aevorin_first_write_${project.id}`, "true");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    loadAllWorkspaceData();
  }, [project.id]);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "backups") {
      fetchBackups();
    } else if (activeTab === "help") {
      fetchLocalInsights();
    }
  }, [activeTab]);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      // 1. Fetch unresolved continuity reports
      const reportsRes = await fetch(`/api/projects/${project.id}/canon/reports`);
      const reportsData = await reportsRes.json();
      const unresolvedCount = reportsData ? reportsData.length : 0;

      if (unresolvedCount > 0) {
        const proceed = confirm(`⚠️ Publish Check Warnings:\n\nThere are ${unresolvedCount} active continuity warnings in your manuscript.\n\nDo you want to ignore them and export anyway?`);
        if (!proceed) {
          setExporting(false);
          return;
        }
      }

      // 2. Perform export compilation
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: exportFormat })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compile manuscript");
      setExportResult(data);

      localStorage.setItem(`aevorin_exported_${project.id}`, "true");
      showToast(`${exportFormat === 'epub' ? 'EPUB' : exportFormat.toUpperCase()} compilation complete`, "success");
    } catch (e: any) {
      showToast("Error compiling: " + e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/backups`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to create snapshot");
      await fetchBackups();
      localStorage.setItem(`aevorin_backup_created_${project.id}`, "true");
      showToast("Offline backup created", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (fileName: string, createdDate: string) => {
    const formatted = new Date(createdDate).toLocaleString();
    const message = `WARNING:\n\nYou are about to replace your current project database.\n\nCurrent changes after:\n${formatted}\n\nwill be lost. Continue?`;
    if (!window.confirm(message)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/backups/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName })
      });
      if (!res.ok) throw new Error("Restore failed");
      await loadAllWorkspaceData();
      alert("Project database successfully restored!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const nav = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSidebarOpen(false); // close on mobile after navigation
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    onBackToDashboard();
  };

  // Setup refs for swipe gestures
  const workspaceShellRef = useRef<HTMLDivElement>(null);

  const storyRoomTabs = ["story", "timeline", "graph", "journey", "character", "world"];

  useSwipeGesture(workspaceShellRef, {
    threshold: 90, // Require a pronounced swipe
    ignoreSelector: ".workspace-content-pane", // Prevent swiping inside the scrollable/editable content areas
    onSwipeLeft: () => {
      // If sidebar is open, swipe left closes it
      if (sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      
      // If we are in story room (not graph/manuscript) and sidebar is closed, navigate next tab
      if (storyRoomTabs.includes(activeTab) && activeTab !== "graph") {
        const idx = storyRoomTabs.indexOf(activeTab);
        if (idx < storyRoomTabs.length - 1) {
          nav(storyRoomTabs[idx + 1] as any);
        }
      }
    },
    onSwipeRight: () => {
      // If we are in story room (not graph/manuscript) and sidebar is closed, navigate prev tab
      if (!sidebarOpen && storyRoomTabs.includes(activeTab) && activeTab !== "graph") {
        const idx = storyRoomTabs.indexOf(activeTab);
        if (idx > 0) {
          nav(storyRoomTabs[idx - 1] as any);
        } else if (idx === 0) {
          // If at the first tab, swipe right opens sidebar
          setSidebarOpen(true);
        }
      } else if (!sidebarOpen && activeTab !== "manuscript" && activeTab !== "graph") {
        // If not in story room tabs, swipe right opens sidebar
        setSidebarOpen(true);
      }
    }
  });

  if (loadingWorkspace) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#070913",
        color: "#fff"
      }}>
        <div className="calm-loading-spinner" style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(129, 140, 248, 0.1)",
          borderTop: "3px solid #818cf8",
          borderRadius: "50%",
          animation: "calmSpin 1s linear infinite",
          marginBottom: "1rem"
        }} />
        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          Bridging to Sanctuary Workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="workspace-shell" ref={workspaceShellRef}>

      {/* ===== OVERLAY SLIDING DRAWER MENU ===== */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: sidebarOpen ? 0 : "-300px",
          width: "300px",
          height: "100vh",
          background: "#242424",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          zIndex: 99999,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: sidebarOpen ? "8px 0 32px rgba(0,0,0,0.6)" : "none",
          display: "flex",
          flexDirection: "column",
          padding: "0"
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Aevorin</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginTop: "0.15rem" }}>{project.name}</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#aaa", fontSize: "1.1rem", cursor: "pointer", padding: "0.4rem 0.6rem", borderRadius: "8px", lineHeight: 1 }}
          >×</button>
        </div>

        {/* Currently writing indicator */}
        {activeTab === "manuscript" && (
          <div style={{
            margin: "1rem 1.5rem 0",
            padding: "0.65rem 0.9rem",
            background: "rgba(224,142,109,0.08)",
            border: "1px solid rgba(224,142,109,0.2)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}>
            <span style={{ fontSize: "0.8rem" }}>✏️</span>
            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>Currently writing…</span>
          </div>
        )}

        {/* Main nav destinations */}
        <nav style={{ flex: 1, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Story Room */}
          <button
            onClick={() => {
              setSidebarOpen(false);
              setActiveTab("story");
            }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1.1rem 1.25rem",
              background: activeTab === "story" ? "rgba(224,142,109,0.1)" : "rgba(255,255,255,0.03)",
              border: activeTab === "story" ? "1px solid rgba(224,142,109,0.3)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background 0.2s, border-color 0.2s"
            }}
          >
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: activeTab === "story" ? "rgba(224,142,109,0.15)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", flexShrink: 0
            }}>📖</div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: activeTab === "story" ? "#e08e6d" : "#fff", lineHeight: 1.2 }}>Story Room</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.38)", marginTop: "0.25rem", lineHeight: 1.4 }}>Outline · Characters · World · Timeline</div>
            </div>
          </button>

          {/* Manuscript Compiler */}
          <button
            onClick={() => {
              setSidebarOpen(false);
              setActiveTab("export");
            }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1.1rem 1.25rem",
              background: activeTab === "export" ? "rgba(159,138,208,0.1)" : "rgba(255,255,255,0.03)",
              border: activeTab === "export" ? "1px solid rgba(159,138,208,0.3)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background 0.2s, border-color 0.2s"
            }}
          >
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: activeTab === "export" ? "rgba(159,138,208,0.15)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", flexShrink: 0
            }}>📄</div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: activeTab === "export" ? "#9f8ad0" : "#fff", lineHeight: 1.2 }}>Manuscript Compiler</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.38)", marginTop: "0.25rem", lineHeight: 1.4 }}>Format · Export · EPUB · DOCX · PDF</div>
            </div>
          </button>

          {/* Dev settings — hidden unless dev mode */}
          {localStorage.getItem("aevorin_dev_mode") === "true" && (
            <button
              onClick={() => { setSidebarOpen(false); setActiveTab("help"); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem 1rem",
                background: "none", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "10px", cursor: "pointer", textAlign: "left", width: "100%",
                color: "rgba(255,255,255,0.35)", fontSize: "0.82rem"
              }}
            >
              <span>⚙️</span><span>Workspace Settings</span>
            </button>
          )}
        </nav>

        {/* Bottom — Library back link */}
        <div style={{ padding: "1rem 1.5rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => { setSidebarOpen(false); handleCloseProject(); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
              background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0",
              color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", textAlign: "left"
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>←</span>
            <span>Back to Library</span>
          </button>
        </div>
      </aside>


      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.55)",
            zIndex: 99998,
            backdropFilter: "blur(4px)",
            transition: "opacity 0.25s ease"
          }}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="workspace-main">

        {/* Story Room header — only for story-room tabs */}
        {(activeTab === "story" || activeTab === "character" || activeTab === "world" || activeTab === "timeline" || activeTab === "history" || activeTab === "rules" || activeTab === "graph" || activeTab === "journey") ? (
          <div style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "#242322",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "1rem 1.5rem 0.85rem 1.5rem",
            backdropFilter: "blur(12px)"
          }}>
            {/* Top Row: title & controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{ background: "none", border: "none", color: "#e08e6d", fontSize: "1.35rem", cursor: "pointer", padding: 0, marginRight: "0.25rem", display: "flex", alignItems: "center" }}
                  title="Open Navigation Menu"
                >☰</button>
                <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e08e6d", fontFamily: "'Source Serif 4', 'Georgia', serif", margin: 0 }}>
                  Story Room
                </h1>
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>• {project.name}</span>
                <span style={{ fontSize: "0.72rem", background: "rgba(52, 211, 153, 0.12)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "12px", padding: "0.15rem 0.55rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  🟢 Local Workspace • Saved in this browser
                </span>
              </div>
              <button
                onClick={() => nav("manuscript")}
                style={{ background: "linear-gradient(135deg, #9f8ad0, #b46cff)", color: "#fff", border: "none", padding: "0.5rem 1.1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(159,138,208,0.35)" }}
              >✏️ Write</button>
            </div>

            {/* Segmented Pill Navigation Control */}
            <div 
              className="segmented-pill-nav"
              style={{
                display: "flex",
                gap: "0.4rem",
                background: "rgba(15, 14, 13, 0.6)",
                padding: "0.3rem",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflowX: "auto",
                scrollbarWidth: "none"
              }}
            >
              {[
                { id: "story",     label: "Outline",    icon: "📖" },
                { id: "character", label: "Characters", icon: "👥" },
                { id: "world",     label: "World",      icon: "🌍" },
                { id: "timeline",  label: "Timeline",   icon: "🕒" },
                { id: "graph",     label: "Graph",      icon: "🕸️" },
                { id: "journey",   label: "Journey",    icon: "🧭" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => nav(tab.id as any)}
                    style={{
                      flex: "1 0 auto",
                      height: "44px",
                      padding: "0 1.1rem",
                      borderRadius: "10px",
                      background: isActive ? "linear-gradient(135deg, rgba(224, 142, 109, 0.22), rgba(224, 142, 109, 0.12))" : "transparent",
                      color: isActive ? "#e08e6d" : "rgba(255, 255, 255, 0.55)",
                      border: isActive ? "1px solid rgba(224, 142, 109, 0.4)" : "1px solid transparent",
                      fontSize: "0.88rem",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s ease",
                      boxShadow: isActive ? "0 4px 14px rgba(224, 142, 109, 0.2)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "1.05rem" }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        ) : activeTab === "export" ? (
          /* Manuscript Compiler — standalone minimal header */
          <div style={{
            background: "#242424",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "1.1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "1.35rem", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                title="Open Navigation Menu"
              >☰</button>
              <div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Aevorin</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#9f8ad0", fontFamily: "'Source Serif 4','Georgia',serif", lineHeight: 1.1 }}>Manuscript Compiler</div>
              </div>
            </div>
            <button
              onClick={() => nav("manuscript")}
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
            >✏️ Write</button>
          </div>

        ) : (
          /* Writing Room — invisible absolute menu button */
          <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem", zIndex: 9999, display: "none" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "rgba(33,33,33,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#e08e6d", fontSize: "1.2rem", cursor: "pointer" }}
            >☰</button>
          </div>
        )}

        <StoryRoomProvider projectId={project.id}>
          {/* Content pane */}
          <div className={`workspace-content-pane ${activeTab === "timeline" ? "timeline-active" : ""}`}>
          {activeTab === "overview" && (
            <Overview
              project={project}
              chapters={chapters}
              scenes={scenes}
              entities={entities}
              onContinueWriting={() => nav("manuscript")}
              onImportManuscript={() => importInputRef.current?.click()}
              projects={projects}
              onLoadProject={onLoadProject}
              onBackToDashboard={onBackToDashboard}
            />
          )}

          {activeTab === "manuscript" && (
            <React.Suspense fallback={<div style={{padding:'2rem',color:'#94a3b8'}}>Loading editor...</div>}>
              <Manuscript
                projectId={project.id}
                chapters={chapters}
                scenes={scenes}
                entities={entities}
                onRefreshChapters={fetchChapters}
                onRefreshScenes={fetchScenes}
                onSeedExample={onSeedExample}
                triggerAction={triggerAction}
                onClearTriggerAction={() => setTriggerAction(null)}
              />
            </React.Suspense>
          )}

          {activeTab === "story" && (
            <React.Suspense fallback={<LoadingPanel />}>
              <Story
                projectId={project.id}
                projectName={project.name}
                scenes={scenes}
                entities={entities}
                onOpenManuscript={(chapterId, sceneId) => {
                  setSelectedChapterId(chapterId);
                  if (sceneId) {
                    setSelectedSceneId(sceneId);
                  }
                  setActiveTab("manuscript");
                }}
              />
            </React.Suspense>
          )}

          {(activeTab === "character" || activeTab === "world" || activeTab === "history" || activeTab === "rules") && (
            <React.Suspense fallback={<LoadingPanel />}>
              <Knowledge
                projectId={project.id}
                entities={entities}
                onRefreshEntities={fetchEntities}
                triggerAction={triggerAction}
                onClearTriggerAction={() => setTriggerAction(null)}
                project={project}
                category={activeTab}
                onJumpToScene={(sceneId) => {
                  const targetScene = scenes.find((s: any) => s.id === sceneId);
                  if (targetScene) {
                    setSelectedChapterId(targetScene.chapter_id);
                    setSelectedSceneId(sceneId);
                    setActiveTab("manuscript");
                  }
                }}
              />
            </React.Suspense>
          )}

          {activeTab === "timeline" && (
            <React.Suspense fallback={<LoadingPanel />}>
              <TimelineView
                projectId={project.id}
              />
            </React.Suspense>
          )}

          {activeTab === "graph" && (
            <React.Suspense fallback={<LoadingPanel />}>
              <StoryGraph
                projectId={project.id}
              />
            </React.Suspense>
          )}

          {activeTab === "journey" && (
            <React.Suspense fallback={<LoadingPanel />}>
              <JourneyView
                projectId={project.id}
              />
            </React.Suspense>
          )}

          {activeTab === "analytics" && (
            <div className="analytics-view-panel" style={{ padding: "2rem", overflowY: "auto", backgroundColor: "#0c101d" }}>
              <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2>Offline Narrative Analytics</h2>

                {loadingAnalytics ? (
                  <p>Computing metrics locally...</p>
                ) : analytics ? (
                  <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                    <div className="analytics-card" style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
                      <h3>Draft Counters</h3>
                      <div style={{ marginTop: "1rem" }}>
                        <p>Total Words: <strong>{analytics.totalWords}</strong></p>
                        <p>Dialogue Ratio: <strong>{analytics.dialogueRatio.toFixed(1)}%</strong></p>
                        <p>Vocabulary Density: <strong>{analytics.vocabularyDensity.toFixed(1)}%</strong></p>
                      </div>
                    </div>

                    <div className="analytics-card" style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px" }}>
                      <h3>Top Repeated Words</h3>
                      <ul style={{ listStyle: "none", marginTop: "1rem" }}>
                        {analytics.topRepeatedWords.map(w => (
                          <li key={w.word} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", padding: "0.25rem 0" }}>
                            <span>{w.word}</span>
                            <strong>{w.count} times</strong>
                          </li>
                        ))}
                        {analytics.topRepeatedWords.length === 0 && <p style={{ color: "#64748b" }}>Not enough text to analyze.</p>}
                      </ul>
                    </div>

                    {/* Readability Ease Analytics Card */}
                    {analytics.readability && (
                      <div className="analytics-card" style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px", gridColumn: "span 2" }}>
                        <h3>Readability Index</h3>
                        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", alignItems: "center" }}>
                          <div style={{ textAlign: "center", borderRight: "1px solid var(--border-color)", paddingRight: "1rem" }}>
                            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-primary)" }}>{analytics.readability.score}</div>
                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "0.25rem" }}>Flesch Ease Score</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{analytics.readability.label}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                              Analyzed: <strong>{analytics.readability.sentenceCount}</strong> sentences, <strong>{analytics.readability.wordCount}</strong> words, and <strong>{analytics.readability.syllableCount}</strong> syllables.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chapter Pacing Analytics Card */}
                    {analytics.pacing && analytics.pacing.length > 0 && (
                      <div className="analytics-card" style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px", gridColumn: "span 2" }}>
                        <h3>Chapter Pacing & Scene Variance</h3>
                        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {analytics.pacing.map(p => (
                            <div key={p.chapterId} style={{ background: "rgba(0,0,0,0.1)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "0.5rem" }}>
                                <span>{p.chapterTitle}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{p.totalWords.toLocaleString()} words • {p.sceneCount} scene{p.sceneCount === 1 ? "" : "s"}</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                <div>Average scene size: <strong>{p.averageSceneSize}</strong></div>
                                <div>Shortest scene: <strong>{p.shortestScene ? `${p.shortestScene.wordCount} words` : "N/A"}</strong></div>
                                <div>Longest scene: <strong>{p.longestScene ? `${p.longestScene.wordCount} words` : "N/A"}</strong></div>
                              </div>
                              
                              {/* Warnings & Flags */}
                              {p.flags.length > 0 && (
                                <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                  {p.flags.map((flag, idx) => (
                                    <div key={idx} style={{ fontSize: "0.8rem", color: "#f87171", display: "flex", gap: "0.5rem" }}>
                                      <span>⚠️</span>
                                      <span>{flag.message}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="analytics-card" style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px", gridColumn: "span 2" }}>
                      <h3>POV Character Scene Balance</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                        {analytics.povDistribution.map(pov => (
                          <div key={pov.name} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ width: "150px", fontSize: "0.9rem" }}>{pov.name}</span>
                            <div style={{ flex: 1, height: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden" }}>
                              <div style={{
                                width: `${(pov.count / (scenes.length || 1)) * 100}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)"
                              }} />
                            </div>
                            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{pov.count} scenes</span>
                          </div>
                        ))}
                        {analytics.povDistribution.length === 0 && <p style={{ color: "#64748b" }}>No POVs defined yet.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Failed to load analytics.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "backups" && (
            <div className="backups-view-panel" style={{ padding: "2rem", overflowY: "auto", backgroundColor: "#0c101d" }}>
              <div className="card" style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2>Local Database Snapshots</h2>
                  <button className="btn btn-primary btn-sm" onClick={handleCreateBackup} disabled={creatingBackup}>
                    {creatingBackup ? "Creating Snapshot..." : "Create New Snapshot"}
                  </button>
                </div>

                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
                  Database copies are saved as standalone SQL snapshots inside your project folder at <code>backups/</code>. Backups are rotated automatically keeping only the 10 most recent checkpoints.
                </p>

                <div className="backups-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {backups.map(b => (
                    <div key={b.fileName} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(15, 23, 42, 0.3)",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.03)"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <strong>{b.fileName}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Saved: {new Date(b.created).toLocaleString()} ({Math.round(b.sizeBytes / 1024)} KB)
                        </span>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRestoreBackup(b.fileName, b.created)}>Restore Point</button>
                    </div>
                  ))}
                  {backups.length === 0 && (
                    <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "1.5rem 0" }}>No database snapshots found.</p>
                  )}
                </div>
              </div>
            </div>
          )}


          {activeTab === "export" && (() => {
            // Sync chapter ordering on first open
            if (compilerChapterOrdering.length === 0 && chapters.length > 0) {
              setCompilerChapterOrdering(chapters);
            }
            const orderedChapters = compilerChapterOrdering.length > 0 ? compilerChapterOrdering : chapters;
            const totalWords = scenes.reduce((s: number, sc: any) => s + (sc.word_count || 0), 0);

            const SectionCard = ({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) => (
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: compilerSection === id ? "1px solid rgba(224,142,109,0.3)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "border-color 0.2s"
              }}>
                <button
                  onClick={() => setCompilerSection(compilerSection === id ? null : id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: compilerSection === id ? "#e08e6d" : "#fff" }}>{title}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", transform: compilerSection === id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {compilerSection === id && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {children}
                  </div>
                )}
              </div>
            );

            const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.85rem" };
            const labelStyle: React.CSSProperties = { fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontWeight: 500 };
            const inputStyle: React.CSSProperties = { background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.82rem", padding: "0.4rem 0.65rem", minWidth: "110px" };
            const textareaStyle: React.CSSProperties = { width: "100%", background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "0.82rem", padding: "0.6rem 0.75rem", resize: "vertical" as const, marginTop: "0.6rem", minHeight: "70px" };

            return (
              <div style={{ flex: 1, overflowY: "auto", background: "#1e1e1e", minHeight: "100%", padding: "1.5rem" }}>

                {/* Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.3rem" }}>Aevorin</div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e08e6d", fontFamily: "'Source Serif 4','Georgia',serif", margin: 0 }}>Manuscript Compiler</h2>
                  <p style={{ marginTop: "0.4rem", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                    {chapters.length} chapters · {scenes.length} scenes · {totalWords.toLocaleString()} words
                  </p>
                </div>

                {/* ── Accordion sections ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>

                  {/* 1. Formatting Engine */}
                  <SectionCard id="formatting" icon="🖋" title="Step 1: Formatting Engine">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={rowStyle}>
                        <span style={labelStyle}>Font Family</span>
                        <select style={inputStyle} value={compilerFontFamily} onChange={e => setCompilerFontFamily(e.target.value)}>
                          <option>Georgia</option><option>Times New Roman</option><option>Garamond</option><option>Helvetica</option><option>Courier New</option>
                        </select>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>Font Size (pt)</span>
                        <select style={inputStyle} value={compilerFontSize} onChange={e => setCompilerFontSize(e.target.value)}>
                          <option>10</option><option>11</option><option>12</option><option>13</option><option>14</option>
                        </select>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>Line Spacing</span>
                        <select style={inputStyle} value={compilerLineSpacing} onChange={e => setCompilerLineSpacing(e.target.value)}>
                          <option value="single">Single</option><option value="1.5">1.5×</option><option value="double">Double</option>
                        </select>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>First-line Indent</span>
                        <button
                          onClick={() => setCompilerIndent(v => !v)}
                          style={{ ...inputStyle, cursor: "pointer", color: compilerIndent ? "#e08e6d" : "rgba(255,255,255,0.4)", fontWeight: 700 }}
                        >{compilerIndent ? "On" : "Off"}</button>
                      </div>
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("chapter-ordering")}
                          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Next: Chapter Ordering →</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 2. Chapter Ordering */}
                  <SectionCard id="chapter-ordering" icon="📋" title="Step 2: Chapter Ordering">
                    {orderedChapters.length === 0 ? (
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem", paddingTop: "0.85rem" }}>No chapters yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.85rem" }}>
                        {orderedChapters.map((ch: any, idx: number) => (
                          <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", width: "18px", textAlign: "center" }}>{idx + 1}</span>
                            <span style={{ flex: 1, fontSize: "0.85rem", color: "#fff", fontWeight: 500 }}>{ch.title || `Chapter ${idx + 1}`}</span>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button
                                disabled={idx === 0}
                                onClick={() => { const arr = [...orderedChapters]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; setCompilerChapterOrdering(arr); }}
                                style={{ background: "none", border: "none", color: idx === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: idx === 0 ? "default" : "pointer", fontSize: "0.85rem", padding: "0.2rem 0.4rem" }}
                              >▲</button>
                              <button
                                disabled={idx === orderedChapters.length - 1}
                                onClick={() => { const arr = [...orderedChapters]; [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; setCompilerChapterOrdering(arr); }}
                                style={{ background: "none", border: "none", color: idx === orderedChapters.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: idx === orderedChapters.length - 1 ? "default" : "pointer", fontSize: "0.85rem", padding: "0.2rem 0.4rem" }}
                              >▼</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setCompilerSection("scene-break")}
                        style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                      >Next: Scene Breaks →</button>
                    </div>
                  </SectionCard>

                  {/* 3. Scene Break Detection */}
                  <SectionCard id="scene-break" icon="✂️" title="Step 3: Scene Break Detection">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={rowStyle}>
                        <span style={labelStyle}>Break Symbol</span>
                        <select style={inputStyle} value={compilerSceneBreak} onChange={e => setCompilerSceneBreak(e.target.value)}>
                          <option value="***">*** (Asterism)</option>
                          <option value="---">--- (Em-dash rule)</option>
                          <option value="#">§ (Section sign)</option>
                          <option value="blank">Blank line only</option>
                        </select>
                      </div>
                      <div style={{ marginTop: "1rem", background: "#141414", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</div>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", lineHeight: 1.7, margin: 0, fontFamily: "Georgia,serif" }}>
                          ...the door closed behind her.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "0.5rem 0", fontSize: "0.9rem", letterSpacing: "0.2em" }}>{compilerSceneBreak === "blank" ? " " : compilerSceneBreak}</p>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", lineHeight: 1.7, margin: 0, fontFamily: "Georgia,serif" }}>
                          Three days later, the letter arrived.
                        </p>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "0.75rem", lineHeight: 1.5 }}>
                        Detected in {scenes.filter((s: any) => (s.content || "").includes("\n\n")).length} of {scenes.length} scenes.
                      </p>
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("front-matter")}
                          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Next: Front Matter →</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 4. Front Matter Generator */}
                  <SectionCard id="front-matter" icon="📰" title="Step 4: Front Matter">
                    <div style={{ paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {[
                        { key: "title" as const, label: "Title" },
                        { key: "subtitle" as const, label: "Subtitle" },
                        { key: "author" as const, label: "Author Name" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <div style={labelStyle}>{label}</div>
                          <input
                            style={{ ...inputStyle, width: "100%", marginTop: "0.3rem" }}
                            placeholder={`e.g. ${label}...`}
                            value={frontMatter[key]}
                            onChange={e => setFrontMatter(f => ({ ...f, [key]: e.target.value }))}
                          />
                        </div>
                      ))}
                      <div>
                        <div style={labelStyle}>Dedication</div>
                        <textarea
                          style={textareaStyle}
                          placeholder="For those who believed..."
                          value={frontMatter.dedication}
                          onChange={e => setFrontMatter(f => ({ ...f, dedication: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                        {[
                          { key: "includeToc" as const, label: "Table of Contents" },
                          { key: "includeCopyright" as const, label: "Copyright Page" }
                        ].map(({ key, label }) => (
                          <button key={key} onClick={() => setFrontMatter(f => ({ ...f, [key]: !f[key] }))} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: frontMatter[key] ? "#9f8ad0" : "rgba(255,255,255,0.1)", display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>{label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("back-matter")}
                          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Next: Back Matter →</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 5. Back Matter Generator */}
                  <SectionCard id="back-matter" icon="📎" title="Step 5: Back Matter">
                    <div style={{ paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <div>
                        <div style={labelStyle}>About the Author</div>
                        <textarea
                          style={textareaStyle}
                          placeholder="Write a short author bio..."
                          value={backMatter.authorBio}
                          onChange={e => setBackMatter(b => ({ ...b, authorBio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Acknowledgements</div>
                        <textarea
                          style={textareaStyle}
                          placeholder="Thank your supporters..."
                          value={backMatter.acknowledgements}
                          onChange={e => setBackMatter(b => ({ ...b, acknowledgements: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                        {[
                          { key: "includeGlossary" as const, label: "Glossary" },
                          { key: "includeIndex" as const, label: "Index" }
                        ].map(({ key, label }) => (
                          <button key={key} onClick={() => setBackMatter(b => ({ ...b, [key]: !b[key] }))} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", background: backMatter[key] ? "#9f8ad0" : "rgba(255,255,255,0.1)", display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)" }}>{label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("consistency")}
                          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Next: Consistency Check →</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 6. Consistency Checks */}
                  <SectionCard id="consistency" icon="🔍" title="Step 6: Consistency Checks">
                    <div style={{ paddingTop: "0.85rem" }}>
                      <button
                        onClick={() => {
                          setCheckingConsistency(true);
                          // Scan character names in entities vs scenes
                          const charNames = entities.filter((e: any) => e.type === "character").map((e: any) => e.name?.toLowerCase());
                          const issues: {type:string; message:string; chapter:string}[] = [];
                          scenes.forEach((sc: any) => {
                            const content = (sc.content || "").toLowerCase();
                            charNames.forEach((name: string) => {
                              if (!name) return;
                              // Check for common misspellings (uppercase first letter only)
                              if (content.includes(name) && !content.includes(name.charAt(0).toUpperCase() + name.slice(1))) {
                                issues.push({ type: "name", message: `"${name}" appears in unexpected casing`, chapter: sc.title || sc.id });
                              }
                            });
                            // Check for double spaces
                            if (content.includes("  ")) {
                              issues.push({ type: "spacing", message: "Double space detected", chapter: sc.title || sc.id });
                            }
                          });
                          setConsistencyIssues(issues);
                          setCheckingConsistency(false);
                        }}
                        disabled={checkingConsistency}
                        style={{ width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", marginBottom: "1rem" }}
                      >
                        {checkingConsistency ? "Scanning..." : "Run Consistency Scan"}
                      </button>
                      {consistencyIssues.length === 0 && !checkingConsistency ? (
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>No issues found. Run scan to check.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {consistencyIssues.length === 0 && <p style={{ fontSize: "0.82rem", color: "#34d399", textAlign: "center" }}>✅ All clear!</p>}
                          {consistencyIssues.map((issue, i) => (
                            <div key={i} style={{ background: "rgba(245,197,66,0.07)", border: "1px solid rgba(245,197,66,0.2)", borderRadius: "8px", padding: "0.65rem 0.85rem" }}>
                              <div style={{ fontSize: "0.78rem", color: "#f5c542", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{issue.type}</div>
                              <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", marginTop: "0.2rem" }}>{issue.message}</div>
                              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "0.15rem" }}>in: {issue.chapter}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("word-count")}
                          style={{ background: "#e08e6d", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Next: Final Reports →</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 7. Word Count Reports */}
                  <SectionCard id="word-count" icon="📊" title="Step 7: Final Reports">
                    <div style={{ paddingTop: "0.85rem" }}>
                      {/* Summary row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                        {[
                          { label: "Total Words", value: totalWords.toLocaleString() },
                          { label: "Chapters", value: chapters.length },
                          { label: "Avg / Chapter", value: chapters.length > 0 ? Math.round(totalWords / chapters.length).toLocaleString() : "—" }
                        ].map(stat => (
                          <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "0.6rem 0.75rem", textAlign: "center" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e08e6d" }}>{stat.value}</div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: "0.15rem" }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Per-chapter bars */}
                      {orderedChapters.length === 0 ? (
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>No chapters.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {orderedChapters.map((ch: any, idx: number) => {
                            const chScenes = scenes.filter((s: any) => s.chapter_id === ch.id);
                            const chWords = chScenes.reduce((a: number, s: any) => a + (s.word_count || 0), 0);
                            const pct = totalWords > 0 ? Math.round((chWords / totalWords) * 100) : 0;
                            return (
                              <div key={ch.id}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{ch.title || `Ch. ${idx+1}`}</span>
                                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{chWords.toLocaleString()} words</span>
                                </div>
                                <div style={{ height: "5px", background: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #9f8ad0, #e08e6d)", borderRadius: "3px", transition: "width 0.4s ease" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCompilerSection("export-packages")}
                          style={{ background: "linear-gradient(135deg, #9f8ad0, #c084fc)", color: "#fff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                        >Proceed to Export ✦</button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 8. Export Packages */}
                  <SectionCard id="export-packages" icon="📦" title="Step 8: Export Packages">
                    <div style={{ paddingTop: "0.85rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "1.25rem" }}>
                        {([
                          { id: "epub",     icon: "📚", label: "EPUB",       desc: "eBook · _epub folder" },
                          { id: "html",     icon: "📄", label: "PDF / HTML", desc: "Print-ready .html" },
                          { id: "docx",     icon: "📘", label: "DOCX",       desc: "Microsoft Word .doc" },
                          { id: "markdown", icon: "📝", label: "Markdown",   desc: "Clean plaintext .md" }
                        ] as const).map(fmt => (
                          <button
                            key={fmt.id}
                            onClick={() => setExportFormat(fmt.id)}
                            style={{
                              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem",
                              padding: "0.85rem 1rem",
                              background: exportFormat === fmt.id ? "rgba(159,138,208,0.12)" : "rgba(255,255,255,0.03)",
                              border: exportFormat === fmt.id ? "1px solid rgba(159,138,208,0.4)" : "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "background 0.2s, border-color 0.2s"
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>{fmt.icon}</span>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: exportFormat === fmt.id ? "#9f8ad0" : "#fff" }}>{fmt.label}</span>
                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{fmt.desc}</span>
                          </button>
                        ))}
                      </div>

                      {/* Compile CTA */}
                      <button
                        onClick={handleExport}
                        disabled={exporting}
                        style={{
                          width: "100%", padding: "1rem",
                          background: exporting ? "rgba(159,138,208,0.35)" : "linear-gradient(135deg, #9f8ad0, #c084fc)",
                          border: "none", borderRadius: "10px", color: "#fff", fontSize: "1rem", fontWeight: 700,
                          cursor: exporting ? "not-allowed" : "pointer",
                          boxShadow: exporting ? "none" : "0 6px 22px rgba(159,138,208,0.35)",
                          letterSpacing: "0.02em", transition: "all 0.2s"
                        }}
                      >
                        {exporting ? "⏳  Compiling..." : `✦  Compile as ${exportFormat.toUpperCase()}`}
                      </button>

                      {/* Success state */}
                      {exportResult && (
                        <div style={{ marginTop: "1rem", background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "10px", padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span>✅</span>
                            <strong style={{ color: "#34d399", fontSize: "0.9rem" }}>Compilation Complete</strong>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "#a7f3d0", fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{exportResult.fileName}</p>
                          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", margin: "0.25rem 0 0", wordBreak: "break-all" }}>{exportResult.path}</p>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                </div>
              </div>
            );
          })()}

          {activeTab === "help" && (
            <div style={{ padding: "2rem", overflowY: "auto", height: "100%", backgroundColor: "#0c101d" }}>
              {showSurvey ? (
                <div className="card" style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
                  <button
                    className="close-survey"
                    onClick={() => { setShowSurvey(false); fetchLocalInsights(); }}
                    style={{
                      position: "absolute",
                      top: "1.5rem",
                      right: "1.5rem",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "1.5rem",
                      cursor: "pointer"
                    }}
                    title="Return to Help"
                  >
                    ×
                  </button>
                  <React.Suspense fallback={<LoadingPanel />}>
                    <TesterSurvey projectId={project.id} onClose={() => { setShowSurvey(false); fetchLocalInsights(); }} />
                  </React.Suspense>
                </div>
              ) : (
                <div className="help-view-panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <section className="card" style={{ textAlign: "left", background: "linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
                      <h2>✍️ AEVORIN Alpha Tester Survey</h2>
                      <p style={{ color: "#cbd5e1", fontSize: "0.85rem", margin: "0.5rem 0 1.2rem 0", lineHeight: "1.5" }}>
                        Help shape the operating system for authors. Share your discovery, confusion points, and tell us what you would miss if AEVORIN disappeared.
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowSurvey(true)}>
                        Open Tester Survey
                      </button>
                    </section>

                    <section className="card" style={{ textAlign: "left" }}>
                      <h2>First-Run Onboarding Checklist</h2>
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0.5rem 0 1rem 0" }}>
                        Complete these 5 core writing tasks to fully experience AEVORIN's local-first offline workspace capabilities.
                      </p>
                      {(() => {
                        const checks = [
                          true,
                          entities.some((e: any) => e.type === "character"),
                          scenes.some((s: any) => s.word_count > 0),
                          backups.length > 0,
                          localStorage.getItem(`aevorin_exported_${project.id}`) === "true"
                        ];
                        const completed = checks.filter(Boolean).length;
                        const pct = Math.round((completed / 5) * 100);
                        return (
                          <>
                            <div style={{ marginBottom: "1.5rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{completed}/5 completed</span>
                                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: pct === 100 ? "#34d399" : "#818cf8" }}>{pct}%</span>
                              </div>
                              <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                <div style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: pct === 100
                                    ? "linear-gradient(90deg, #34d399 0%, #22d3ee 100%)"
                                    : "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
                                  transition: "width 0.5s ease",
                                  borderRadius: "4px"
                                }} />
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                              <CheckItem done={checks[0]} label={`Create or load a project workspace (Done: "${project.name}")`} />
                              <CheckItem done={checks[1]} label="Create a character entity in Story Bible" />
                              <CheckItem done={checks[2]} label="Write your first scene in Draft Editor" />
                              <CheckItem done={checks[3]} label="Create a database backup snapshot in Snapshots" />
                              <CheckItem done={checks[4]} label="Compile manuscript in Compiler tab" />
                            </div>
                            {pct === 100 && (
                              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(52, 211, 153, 0.1)", borderRadius: "8px", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                                <strong style={{ color: "#34d399" }}>🎉 All onboarding tasks complete!</strong>
                                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.35rem" }}>You've explored AEVORIN's core capabilities. Thank you for being an alpha tester.</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </section>

                    <section className="card" style={{ textAlign: "left" }}>
                      <h2>Local Usage Insights</h2>
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0.5rem 0 1rem 0" }}>
                        Offline event statistics recorded in your SQLite database. Zero network tracking.
                      </p>
                      {localInsights ? (
                        <div>
                          <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#818cf8", marginBottom: "1rem" }}>
                            Total Local Events Logged: {localInsights.totalEvents}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {localInsights.events.map((ev: any) => (
                              <div key={ev.event_name} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.15)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                                <code style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{ev.event_name}</code>
                                <strong style={{ color: "#818cf8", fontSize: "0.85rem" }}>{ev.count} times</strong>
                              </div>
                            ))}
                            {localInsights.events.length === 0 && (
                              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No events logged yet.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading usage statistics...</p>
                      )}
                    </section>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <section className="card" style={{ textAlign: "left" }}>
                      <h2>Report Feedback & Issues</h2>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const type = (form.elements.namedItem("feedbackType") as HTMLSelectElement).value;
                        const message = (form.elements.namedItem("feedbackMessage") as HTMLTextAreaElement).value;
                        if (!message.trim()) return;
                        const key = `aevorin_feedback_${project.id}`;
                        const existing = JSON.parse(localStorage.getItem(key) || "[]");
                        existing.push({ type, message: message.trim(), timestamp: new Date().toISOString() });
                        localStorage.setItem(key, JSON.stringify(existing));
                        alert("Thank you! Your feedback has been saved locally.");
                        form.reset();
                      }} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="form-group">
                          <label>Feedback Type</label>
                          <select name="feedbackType" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                            <option value="bug">🐛 Report a Bug / Issue</option>
                            <option value="feature">💡 Suggest a Feature / Improvement</option>
                            <option value="ux">🎨 UI/UX Feedback</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Message / Description</label>
                          <textarea name="feedbackMessage" placeholder="Describe what occurred, or what you would love to see..." required style={{ minHeight: "80px" }} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>Submit Feedback</button>
                      </form>
                    </section>

                    <section className="card" style={{ textAlign: "left" }}>
                      <h2>Mobile Connection & Diagnostics</h2>
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0.5rem 0 1.25rem 0", lineHeight: "1.5" }}>
                        Manage emulator link states or clear mobile caches. These commands are optimized for phone viewports.
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button className="btn btn-secondary btn-sm" style={{ minHeight: "44px" }} onClick={() => {
                          window.location.href = apiUrl(`/api/projects/${project.id}/diagnostics`);
                        }}>
                          Export Diagnostics (.json)
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ minHeight: "44px", border: "1px solid rgba(245, 158, 11, 0.2)" }} 
                          onClick={() => {
                            const bridge = (window as any).AndroidBridge;
                            if (bridge) {
                              if (typeof bridge.postMessage === 'function') {
                                bridge.postMessage('refresh');
                              } else if (typeof bridge.refresh === 'function') {
                                bridge.refresh();
                              } else {
                                window.location.reload();
                              }
                            } else {
                              window.location.reload();
                            }
                          }}
                        >
                          ⟳ Reload Engine
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ minHeight: "44px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }} 
                          onClick={() => {
                            const bridge = (window as any).AndroidBridge;
                            if (bridge) {
                              if (typeof bridge.postMessage === 'function') {
                                bridge.postMessage('disconnect');
                              } else if (typeof bridge.disconnect === 'function') {
                                bridge.disconnect();
                              } else {
                                onBackToDashboard();
                              }
                            } else {
                              onBackToDashboard();
                            }
                          }}
                        >
                          Disconnect Workspace
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        {(activeTab === "story" || activeTab === "timeline" || activeTab === "graph" || activeTab === "journey" || activeTab === "character" || activeTab === "world" || activeTab === "history" || activeTab === "rules") && (
          <div className="mobile-bottom-nav-bar">
            {[
              { id: "story",     label: "Outline",    icon: "📖" },
              { id: "character", label: "Characters", icon: "👥" },
              { id: "world",     label: "World",      icon: "🌍" },
              { id: "timeline",  label: "Timeline",   icon: "🕒" },
              { id: "graph",     label: "Graph",      icon: "🕸️" },
              { id: "journey",   label: "Journey",    icon: "🧭" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => nav(tab.id as any)}
                className={`mobile-bottom-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="icon">{tab.icon}</span>
                <span className="label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </StoryRoomProvider>
    </main>

      {/* Global Quick Actions FAB */}
      <FAB icon="✦" onClick={() => setShowQuickActions(true)} />

      <BottomSheet isOpen={showQuickActions} onClose={() => setShowQuickActions(false)} title="Quick Actions">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <Button onClick={() => { setShowQuickActions(false); setActiveTab("manuscript"); setTriggerAction("create-chapter"); }} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", textAlign: "left", fontSize: "0.9rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>📝</div>
            <div>New Chapter</div>
          </Button>
          <Button onClick={() => { setShowQuickActions(false); setActiveTab("character"); setTriggerAction("create-character"); }} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", textAlign: "left", fontSize: "0.9rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>👤</div>
            <div>New Character</div>
          </Button>
          <Button onClick={() => { setShowQuickActions(false); setShowSearchOverlay(true); }} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", textAlign: "left", fontSize: "0.9rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>🔍</div>
            <div>Search Story</div>
          </Button>
          <Button onClick={() => { setShowQuickActions(false); setFocusMode(!focusMode); }} style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", textAlign: "left", fontSize: "0.9rem" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>👁️</div>
            <div>{focusMode ? "Exit Focus Mode" : "Focus Mode"}</div>
          </Button>
        </div>
      </BottomSheet>

      {/* Command Palette Component */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setActiveTab}
        onToggleFocus={() => setFocusMode(!focusMode)}
        onSetTheme={(theme) => updatePreferences({ theme })}
        onCreateChapter={() => { setActiveTab("manuscript"); setTriggerAction("create-chapter"); }}
        onImportManuscript={() => importInputRef.current?.click()}
        onExportEPUB={() => { setActiveTab("export"); setExportFormat("epub"); handleExport(); }}
        onBackToDashboard={onBackToDashboard}
      />

      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        entities={entities}
        scenes={scenes}
        chapters={chapters}
        onSelectEntity={(entityId, category) => {
          // Open story bible to that entity
          setActiveTab(category === "character" ? "character" : "world");
        }}
        onSelectScene={(chapterId, sceneId) => {
          setSelectedChapterId(chapterId);
          if (sceneId) setSelectedSceneId(sceneId);
          setActiveTab("manuscript");
        }}
      />
      {/* Hidden Manuscript Import File Input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.md"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const text = evt.target?.result as string;
              const metrics = parseManuscriptLocally(text);
              setImportPreview({
                filename: file.name,
                content: text,
                ...metrics
              });
            };
            reader.readAsText(file);
          }
          e.target.value = "";
        }}
      />

      {/* Manuscript Import Preview Modal */}
      {importPreview && (
        <Modal
          isOpen={true}
          onClose={() => setImportPreview(null)}
          title="Manuscript Import Preview"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Confirm importing your manuscript file: <strong>{importPreview.filename}</strong>
            </p>
            
            <div style={{
              background: "rgba(0,0,0,0.2)",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.9rem"
            }}>
              <div>Chapters: <strong style={{ color: "var(--accent-primary)" }}>{importPreview.chaptersCount}</strong></div>
              <div>Scenes: <strong style={{ color: "var(--accent-primary)" }}>{importPreview.scenesCount}</strong></div>
              <div>Words: <strong style={{ color: "var(--accent-primary)" }}>{importPreview.wordCount.toLocaleString()}</strong></div>
              <div>Estimated Reading Time: <strong>{importPreview.readingTime}</strong></div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              * This operation is safe and transactional. Your project data will be appended to the current manuscript structure.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button className="secondary" onClick={() => setImportPreview(null)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                const content = importPreview.content;
                const filename = importPreview.filename;
                setImportPreview(null);
                try {
                  const res = await fetch(`/api/projects/${project.id}/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename, content })
                  });
                  if (!res.ok) throw new Error("Failed to import manuscript");
                  
                  showToast(`Manuscript imported: ${importPreview.chaptersCount} chapters, ${importPreview.scenesCount} scenes`, "success");
                  await fetchChapters();
                  await fetchScenes();
                } catch (err: any) {
                  console.error(err);
                  showToast(err.message || "Unable to import manuscript", "error");
                }
              }}>
                Confirm Import
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
