import { apiUrl } from "../lib/api";
import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useWorkspaceStore } from "./store/WorkspaceStore";
import { usePreferences } from "./preferences/PreferencesContext";
import { useToast } from "../components/providers/ToastProvider";
import { computeDiff } from "../lib/diff";
import { useActivityTracker } from "../hooks/useActivityTracker";
import { useLongPress } from "../hooks/useLongPress";
import { BottomSheet, Button, PromptModal } from "../components/ui";
import { db } from "../lib/db";
import { SyncManager } from "../services/sync/SyncManager";
import { ManuscriptRepository } from "../database/repositories/manuscriptRepository";
import { MentionSuggestPopover } from "../components/workspace/MentionSuggestPopover";
import { WritingInspector } from "../components/workspace/WritingInspector";
import { SessionGoalsWidget } from "../components/workspace/SessionGoalsWidget";

function extractPlainTextFromTipTap(contentStr: string): string {
  if (!contentStr) return "";
  try {
    const doc = JSON.parse(contentStr);
    let text = "";
    const traverse = (node: any) => {
      if (node.type === "text") {
        text += node.text;
      } else if (node.content) {
        for (const child of node.content) {
          traverse(child);
        }
      }
      if (node.type === "paragraph" || node.type === "heading") {
        text += "\n";
      }
    };
    traverse(doc);
    return text;
  } catch (e) {
    return contentStr;
  }
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
}

interface Scene {
  id: string;
  chapter_id: string | null;
  title: string;
  content: string;
  summary: string;
  order_index: number;
  pov_entity_id: string | null;
  purpose: string;
  conflict: string;
  outcome: string;
  word_count: number;
  status: string;
  mood: string;
  tags: string;
}

interface Entity {
  id: string;
  type: string;
  title: string;
  summary?: string;
  metadata?: Record<string, any>;
}

interface VersionHistory {
  id: string;
  version_number: number;
  summary: string;
  created_at: string;
}

interface ManuscriptProps {
  projectId: string;
  chapters: Chapter[];
  scenes: Scene[];
  entities: Entity[];
  onRefreshChapters: () => Promise<void>;
  onRefreshScenes: () => Promise<void>;
  onSeedExample?: () => void;
  triggerAction?: string | null;
  onClearTriggerAction?: () => void;
}

function SceneNode({ sc, activeSceneId, setActiveSceneId, setContextMenuContext, onDeleteScene }: any) {
  const longPress = useLongPress(
    () => setContextMenuContext({ type: "scene", id: sc.id, title: sc.title }),
    () => setActiveSceneId(sc.id),
    { delay: 500 }
  );
  return (
    <div className={`tree-scene-item ${activeSceneId === sc.id ? "active" : ""}`} {...longPress} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteScene(sc.id);
        }}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.75rem",
          cursor: "pointer",
          padding: "0.1rem 0.3rem"
        }}
        title="Delete Scene"
      >
        🗑️
      </button>
    </div>
  );
}

function ChapterNode({ ch, children, renamingChapterId, renameTitle, setRenameTitle, handleRenameChapterSubmit, setRenamingChapterId, setContextMenuContext, onDeleteChapter, onAddSceneToChapter }: any) {
  const longPress = useLongPress(
    () => setContextMenuContext({ type: "chapter", id: ch.id, title: ch.title }),
    undefined,
    { delay: 500 }
  );

  return (
    <div className="tree-chapter-group">
      <div className="tree-chapter-header" {...longPress} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {renamingChapterId === ch.id ? (
          <input
            type="text"
            className="tree-rename-input"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onBlur={() => handleRenameChapterSubmit(ch.id)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameChapterSubmit(ch.id)}
            autoFocus
          />
        ) : (
          <strong
            onClick={() => {
              setRenamingChapterId(ch.id);
              setRenameTitle(ch.title);
            }}
            title="Click to rename chapter"
            style={{ cursor: "pointer", flex: 1 }}
          >
            {ch.title}
          </strong>
        )}
        <div style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
          <button
            onClick={() => onAddSceneToChapter(ch.id)}
            style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.85rem", cursor: "pointer", padding: "0.1rem 0.3rem" }}
            title="Add Scene to this Chapter"
          >
            +
          </button>
          <button
            onClick={() => onDeleteChapter(ch.id)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", cursor: "pointer", padding: "0.1rem 0.3rem" }}
            title="Delete Chapter"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="tree-scenes-list">
        {children}
      </div>
    </div>
  );
}

export default function Manuscript({
  projectId,
  chapters = [],
  scenes = [],
  entities = [],
  onRefreshChapters,
  onRefreshScenes,
  onSeedExample,
  triggerAction,
  onClearTriggerAction
}: ManuscriptProps) {
  const {
    selectedSceneId: activeSceneId,
    setSelectedSceneId: setActiveSceneId,
    selectedChapterId,
    setSelectedChapterId,
    focusMode: isFocusMode,
    setFocusMode: setIsFocusMode,
    setSidebarOpen
  } = useWorkspaceStore();

  const { showToast } = useToast();

  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [renamingChapterId, setRenamingChapterId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [contextMenuContext, setContextMenuContext] = useState<{ type: "chapter" | "scene", id: string, title: string } | null>(null);

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    confirmText?: string;
    onConfirm: (val: string) => void;
  }>({ isOpen: false, title: "", onConfirm: () => {} });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", subtitle: "", confirmText: "Confirm", onConfirm: () => {} });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Scene[] | null>(null);

  // Version state
  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [checkpointSummary, setCheckpointSummary] = useState("");
  const [diffViewMode, setDiffViewMode] = useState<"inline" | "side-by-side">("inline");
  const [diffData, setDiffData] = useState<{
    versionNumber: number;
    oldText: string;
    newText: string;
  } | null>(null);

  // Productization / Hardening UI states
  const { preferences, updatePreferences } = usePreferences();
  const [showTypographySettings, setShowTypographySettings] = useState(false);
  const [isTypewriter, setIsTypewriter] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<number>(1000);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<{ content: any; wordCount: number; timestamp: string } | null>(null);

  // Sprint 1 & 2 Signature Feature States
  const [scriveningsMode, setScriveningsMode] = useState<"scene" | "chapter" | "book">("scene");
  const [readingWidth, setReadingWidth] = useState<"compact" | "comfort" | "wide">("comfort");
  const [typewriterOffset, setTypewriterOffset] = useState<number>(42);
  const [showWritingInspector, setShowWritingInspector] = useState(false);
  const [isFocusFaded, setIsFocusFaded] = useState(false);

  // Character Consistency Engine State
  const [consistencyIssues, setConsistencyIssues] = useState<any[]>([]);

  // Collapsible Sidebars & Expandable metadata fields states
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [expandedField, setExpandedField] = useState<{ field: "conflict" | "outcome" | "purpose"; value: string } | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Sync Focus Mode to sidebars
  useEffect(() => {
    if (isFocusMode) {
      setLeftCollapsed(true);
      setRightCollapsed(true);
    }
  }, [isFocusMode]);
  // Track recent activity
  useActivityTracker(projectId, activeSceneId, "scene", dirty ? "edited" : "viewed");

  // Ref to track first load
  const isInitialLoad = useRef(true);

  // Continue memory: load and save last active scene
  useEffect(() => {
    const safeScenes = Array.isArray(scenes) ? scenes : [];
    if (!activeSceneId && safeScenes.length > 0) {
      const saved = localStorage.getItem(`aevorin_last_scene_${projectId}`);
      if (saved && safeScenes.some(s => s.id === saved)) {
        setActiveSceneId(saved);
      } else {
        setActiveSceneId(safeScenes[0].id);
      }
    }
  }, [projectId, scenes, activeSceneId]);

  useEffect(() => {
    if (activeSceneId) {
      localStorage.setItem(`aevorin_last_scene_${projectId}`, activeSceneId);
    }
  }, [activeSceneId, projectId]);

  // Session active duration tracker
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const durationKey = `aevorin_session_duration_${projectId}_${todayStr}`;
    
    const interval = setInterval(() => {
      if (document.hasFocus() && activeSceneId) {
        try {
          const current = parseInt(localStorage.getItem(durationKey) || "5280", 10);
          localStorage.setItem(durationKey, (current + 1).toString());
        } catch (e) {
          console.error(e);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [projectId, activeSceneId]);

  const updateActiveScene = (updatedFields: Partial<Scene>) => {
    setActiveScene(prev => {
      if (!prev) return null;
      return { ...prev, ...updatedFields };
    });
    setDirty(true);
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onFocus: () => {
      setIsEditorFocused(true);
    },
    onBlur: () => {
      setIsEditorFocused(false);
    },
    onUpdate: ({ editor }) => {
      if (activeScene) {
        const text = editor.getText();
        const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        setActiveScene(prev => prev ? { ...prev, word_count: wordCount } : null);
        
        // Skip setting dirty flag on first loading content updates
        if (!isInitialLoad.current) {
          setDirty(true);

          // Save local backup recovery instantly to localStorage
          localStorage.setItem(`aevorin_recovery_${activeScene.id}`, JSON.stringify({
            content: editor.getJSON(),
            wordCount,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }, [activeSceneId]);

  // Load active scene & version checkpoints
  useEffect(() => {
    if (activeSceneId) {
      isInitialLoad.current = true;
      const safeScenes = Array.isArray(scenes) ? scenes : [];
      const scene = safeScenes.find(s => s.id === activeSceneId);
      if (scene) {
        setActiveScene(scene);
        
        // 🌟 Read latest draft content from IndexedDB Dexie / LocalStorage first!
        (async () => {
          let contentToSet = scene.content || "";
          
          try {
            const localDraft = await db.drafts.where("sceneId").equals(scene.id).first();
            if (localDraft && localDraft.contentDelta) {
              contentToSet = localDraft.contentDelta;
            } else {
              const localDbScene = await db.scenes.get(scene.id);
              if (localDbScene && localDbScene.content) {
                contentToSet = localDbScene.content;
              }
            }
          } catch (e) {}

          const savedRecovery = localStorage.getItem(`aevorin_recovery_${scene.id}`);
          if (savedRecovery) {
            try {
              const parsed = JSON.parse(savedRecovery);
              if (parsed && parsed.content) {
                contentToSet = JSON.stringify(parsed.content);
              }
            } catch (e) {}
          }

          if (editor && !editor.isDestroyed) {
            try {
              const parsed = JSON.parse(contentToSet);
              editor.commands.setContent(parsed);
            } catch (e) {
              editor.commands.setContent(contentToSet);
            }
          }
        })();

        fetchVersionHistory(scene.id);
        setDirty(false);
      }
      // Re-enable dirty logging after rendering finishes
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 200);
    } else {
      setActiveScene(null);
      if (editor && !editor.isDestroyed) editor.commands.setContent("");
      setVersions([]);
      setRecoveryDraft(null);
    }
  }, [activeSceneId, scenes, editor]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Manual Save
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave("Manual Save Point");
      }
      // Ctrl+F: Focus Search
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("sidebar-search-input")?.focus();
      }
      // Ctrl+O: Toggle Focus Mode
      if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setIsFocusMode(!isFocusMode);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScene, editor]);

  // Local-First 500ms Debounced Auto-save to Dexie IndexedDB
  useEffect(() => {
    if (!dirty || !activeScene || !editor || editor.isDestroyed) return;

    const timer = setTimeout(async () => {
      if (!editor || editor.isDestroyed) return;
      try {
        const jsonContent = editor.getJSON();
        const contentString = JSON.stringify(jsonContent);

        // 1. Write to Dexie IndexedDB local database immediately
        const now = new Date().toISOString();
        await db.scenes.put({
          id: activeScene.id,
          projectId,
          chapterId: activeScene.chapter_id || "",
          title: activeScene.title,
          content: contentString,
          wordCount: activeScene.word_count,
          orderIndex: activeScene.order_index || 0,
          updatedAt: now,
          version: 1,
          syncStatus: "pending"
        });

        await db.drafts.put({
          id: `draft_${activeScene.id}`,
          sceneId: activeScene.id,
          contentDelta: contentString,
          contentHash: contentString.length.toString(),
          wordCount: activeScene.word_count,
          updatedAt: now,
          syncStatus: "pending"
        });

        // 2. Try background API sync
        try {
          const updates = {
            title: activeScene.title,
            content: contentString,
            summary: activeScene.summary,
            povEntityId: activeScene.pov_entity_id,
            purpose: activeScene.purpose,
            conflict: activeScene.conflict,
            outcome: activeScene.outcome,
            wordCount: activeScene.word_count,
            status: activeScene.status,
            mood: activeScene.mood,
            chapterId: activeScene.chapter_id
          };

          await fetch(apiUrl(`/api/projects/${projectId}/scenes/${activeScene.id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          await onRefreshScenes();
        } catch (_) {
          // Offline mode: local Dexie save succeeded cleanly!
        }

        // Clean up recovery backup since Dexie write succeeded
        localStorage.removeItem(`aevorin_recovery_${activeScene.id}`);
        setDirty(false);
      } catch (e) {
        console.error("[Autosave] Error during local Dexie write:", e);
      }
    }, 500); // Fast 500ms local write

    return () => clearTimeout(timer);
  }, [dirty, activeScene, projectId]);

  // Real-time Consistency Engine Check
  const checkConsistency = async (text: string) => {
    if (!text || text.trim() === "") {
      setConsistencyIssues([]);
      return;
    }

    if (activeScene) {
      try {
        const res = await fetch(`/api/projects/${projectId}/canon/check-scene`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneId: activeScene.id,
            text: text
          })
        });
        if (res.ok) {
          const backendIssues = await res.json();
          const formatted = backendIssues.map((issue: any) => ({
            type: issue.severity === "critical" ? "Physical" : "World",
            message: issue.message,
            sentence: issue.evidence,
            characterName: issue.affectedEntity,
            fact: issue.category
          }));
          setConsistencyIssues(formatted);
          return;
        }
      } catch (err) {
        console.warn("[Manuscript] Backend consistency checker offline, using client-side fallback:", err);
      }
    }

    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const issues: any[] = [];
    const chars = entities.filter(e => e.type === "character");

    sentences.forEach(sentenceRaw => {
      const sentence = sentenceRaw.trim();
      const sentenceLower = sentence.toLowerCase();

      chars.forEach(char => {
        const charTitle = char.title.toLowerCase();
        if (sentenceLower.includes(charTitle)) {
          const meta = char.metadata || {};
          const summary = char.summary || "";

          // 1. LEFT ARM / HAND
          const hasLeftArmLimitation = 
            summary.toLowerCase().includes("lost left arm") ||
            summary.toLowerCase().includes("missing left arm") ||
            summary.toLowerCase().includes("no left arm") ||
            summary.toLowerCase().includes("amputated left arm") ||
            summary.toLowerCase().includes("lost left hand") ||
            summary.toLowerCase().includes("missing left hand") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("lost left arm") ||
                val.toLowerCase().includes("missing left arm") ||
                val.toLowerCase().includes("no left arm") ||
                val.toLowerCase().includes("amputated left arm") ||
                val.toLowerCase().includes("lost left hand") ||
                val.toLowerCase().includes("missing left hand") ||
                val.toLowerCase().includes("one-armed")
              )
            );

          if (hasLeftArmLimitation) {
            const usesLeftLimb = 
              sentenceLower.includes("left hand") ||
              sentenceLower.includes("left arm") ||
              sentenceLower.includes("left wrist") ||
              sentenceLower.includes("left fingers") ||
              sentenceLower.includes("left elbow") ||
              sentenceLower.includes("left fist") ||
              sentenceLower.includes("left shoulder");

            const isLossEvent = 
              sentenceLower.includes("lost") ||
              sentenceLower.includes("severed") ||
              sentenceLower.includes("cut off") ||
              sentenceLower.includes("amputated");

            if (usesLeftLimb && !isLossEvent) {
              issues.push({
                type: "Physical",
                message: `${char.title} uses their left arm/hand, but their profile indicates they lost it.`,
                sentence,
                characterName: char.title,
                fact: "Lost left arm"
              });
            }
          }

          // 2. RIGHT ARM / HAND
          const hasRightArmLimitation = 
            summary.toLowerCase().includes("lost right arm") ||
            summary.toLowerCase().includes("missing right arm") ||
            summary.toLowerCase().includes("no right arm") ||
            summary.toLowerCase().includes("amputated right arm") ||
            summary.toLowerCase().includes("lost right hand") ||
            summary.toLowerCase().includes("missing right hand") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("lost right arm") ||
                val.toLowerCase().includes("missing right arm") ||
                val.toLowerCase().includes("no right arm") ||
                val.toLowerCase().includes("amputated right arm") ||
                val.toLowerCase().includes("lost right hand") ||
                val.toLowerCase().includes("missing right hand")
              )
            );

          if (hasRightArmLimitation) {
            const usesRightLimb = 
              sentenceLower.includes("right hand") ||
              sentenceLower.includes("right arm") ||
              sentenceLower.includes("right wrist") ||
              sentenceLower.includes("right fingers") ||
              sentenceLower.includes("right elbow") ||
              sentenceLower.includes("right fist") ||
              sentenceLower.includes("right shoulder");

            const isLossEvent = 
              sentenceLower.includes("lost") ||
              sentenceLower.includes("severed") ||
              sentenceLower.includes("cut off") ||
              sentenceLower.includes("amputated");

            if (usesRightLimb && !isLossEvent) {
              issues.push({
                type: "Physical",
                message: `${char.title} uses their right arm/hand, but their profile indicates they lost it.`,
                sentence,
                characterName: char.title,
                fact: "Lost right arm"
              });
            }
          }

          // 3. BLINDNESS IN EYE
          const hasLeftEyeLimitation = 
            summary.toLowerCase().includes("blind in left eye") ||
            summary.toLowerCase().includes("lost left eye") ||
            summary.toLowerCase().includes("missing left eye") ||
            summary.toLowerCase().includes("no left eye") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("blind in left eye") ||
                val.toLowerCase().includes("lost left eye") ||
                val.toLowerCase().includes("missing left eye") ||
                val.toLowerCase().includes("no left eye")
              )
            );

          if (hasLeftEyeLimitation) {
            const usesLeftEye = sentenceLower.includes("left eye");
            if (usesLeftEye) {
              issues.push({
                type: "Vision",
                message: `${char.title} is blind in their left eye or missing it, but the text describes their left eye.`,
                sentence,
                characterName: char.title,
                fact: "Blind in left eye"
              });
            }
          }

          const hasRightEyeLimitation = 
            summary.toLowerCase().includes("blind in right eye") ||
            summary.toLowerCase().includes("lost right eye") ||
            summary.toLowerCase().includes("missing right eye") ||
            summary.toLowerCase().includes("no right eye") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("blind in right eye") ||
                val.toLowerCase().includes("lost right eye") ||
                val.toLowerCase().includes("missing right eye") ||
                val.toLowerCase().includes("no right eye")
              )
            );

          if (hasRightEyeLimitation) {
            const usesRightEye = sentenceLower.includes("right eye");
            if (usesRightEye) {
              issues.push({
                type: "Vision",
                message: `${char.title} is blind in their right eye or missing it, but the text describes their right eye.`,
                sentence,
                characterName: char.title,
                fact: "Blind in right eye"
              });
            }
          }

          // 4. TOTAL BLINDNESS
          const isBlind = 
            summary.toLowerCase().includes("blind") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("blindness") ||
                (val.toLowerCase().includes("blind") && !val.toLowerCase().includes("blind in left eye") && !val.toLowerCase().includes("blind in right eye"))
              )
            );

          if (isBlind) {
            const visualAction = 
              sentenceLower.includes(" saw ") ||
              sentenceLower.includes(" looked ") ||
              sentenceLower.includes(" stared ") ||
              sentenceLower.includes(" read ") ||
              sentenceLower.includes(" gazed ") ||
              sentenceLower.includes(" watched ");
            if (visualAction) {
              issues.push({
                type: "Vision",
                message: `${char.title} is marked as blind, but performs a visual action (saw, looked, stared, read, etc.).`,
                sentence,
                characterName: char.title,
                fact: "Blind"
              });
            }
          }

          // 5. MUTENESS
          const isMute = 
            summary.toLowerCase().includes("mute") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("mute") ||
                val.toLowerCase().includes("cannot speak")
              )
            );

          if (isMute) {
            const speakingAction = 
              sentenceLower.includes(" said") ||
              sentenceLower.includes(" spoke") ||
              sentenceLower.includes(" whispered") ||
              sentenceLower.includes(" shouted") ||
              sentenceLower.includes(" replied") ||
              sentenceLower.includes(" answered") ||
              sentenceLower.includes(" screamed");
            if (speakingAction) {
              issues.push({
                type: "Speech",
                message: `${char.title} is mute, but the text describes them speaking (said, spoke, whispered, etc.).`,
                sentence,
                characterName: char.title,
                fact: "Mute"
              });
            }
          }

          // 6. DEAFNESS
          const isDeaf = 
            summary.toLowerCase().includes("deaf") ||
            Object.values(meta).some((val: any) => 
              typeof val === "string" && (
                val.toLowerCase().includes("deaf") ||
                val.toLowerCase().includes("cannot hear")
              )
            );

          if (isDeaf) {
            const hearingAction = 
              sentenceLower.includes(" heard") ||
              sentenceLower.includes(" listened") ||
              sentenceLower.includes(" overheard");
            if (hearingAction) {
              issues.push({
                type: "Hearing",
                message: `${char.title} is deaf, but the text describes them hearing or listening.`,
                sentence,
                characterName: char.title,
                fact: "Deaf"
              });
            }
          }

          // 7. DECEASED STATUS
          const isDeceased = 
            (meta.status || "").toLowerCase() === "deceased" ||
            (meta.status || "").toLowerCase() === "dead" ||
            summary.toLowerCase().includes("deceased") ||
            summary.toLowerCase().includes("dead") ||
            summary.toLowerCase().includes("dies in") ||
            summary.toLowerCase().includes("killed in");

          if (isDeceased) {
            const activeAction = 
              sentenceLower.includes(" walked") ||
              sentenceLower.includes(" spoke") ||
              sentenceLower.includes(" ran") ||
              sentenceLower.includes(" smiled") ||
              sentenceLower.includes(" frowned") ||
              sentenceLower.includes(" fought") ||
              sentenceLower.includes(" laughed");
            if (activeAction) {
              issues.push({
                type: "Status",
                message: `${char.title} is deceased, but performs active narrative actions in this sentence.`,
                sentence,
                characterName: char.title,
                fact: "Deceased"
              });
            }
          }
        }
      });
    });

    setConsistencyIssues(issues);
  };

  useEffect(() => {
    if (!editor || editor.isDestroyed || !activeScene) {
      setConsistencyIssues([]);
      return;
    }

    const timer = setTimeout(() => {
      const text = editor.getText();
      checkConsistency(text);
    }, 2500); // Increased debounce to preserve battery / prevent API spam

    return () => clearTimeout(timer);
  }, [editor?.getText(), activeScene?.id, entities]);

  // Handle triggerAction events dispatched from Command Palette
  useEffect(() => {
    if (!triggerAction) return;

    if (triggerAction === "save-scene") {
      handleSave();
      onClearTriggerAction?.();
    } else if (triggerAction === "create-chapter") {
      setPromptModal({
        isOpen: true,
        title: "New Chapter",
        subtitle: "Enter a title for your new chapter",
        placeholder: "e.g. Chapter 1: The Gathering Storm",
        confirmText: "Create Chapter",
        onConfirm: (title) => {
          setPromptModal((prev) => ({ ...prev, isOpen: false }));
          if (title.trim()) {
            (async () => {
              try {
                const res = await fetch(`/api/projects/${projectId}/chapters`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: title.trim() }),
                });
                if (!res.ok) throw new Error("Failed to create chapter");
                setNewChapterTitle("");
                await onRefreshChapters();
              } catch (e) {
                console.error(e);
              }
            })();
          }
        }
      });
      onClearTriggerAction?.();
    } else if (triggerAction === "create-scene") {
      setPromptModal({
        isOpen: true,
        title: "New Scene",
        subtitle: "Enter a title for your new manuscript scene",
        placeholder: "e.g. Scene 1 - Midnight Arrival",
        confirmText: "Create Scene",
        onConfirm: (title) => {
          setPromptModal((prev) => ({ ...prev, isOpen: false }));
          if (title.trim()) {
            const chapterId = chapters.length > 0 ? chapters[0].id : null;
            (async () => {
              try {
                const res = await fetch(`/api/projects/${projectId}/scenes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chapterId, title: title.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to create scene");
                await onRefreshScenes();
                setActiveSceneId(data.id);
              } catch (e) {
                console.error(e);
              }
            })();
          }
        }
      });
      onClearTriggerAction?.();
    }
  }, [triggerAction, chapters, projectId]);

  const fetchVersionHistory = async (sceneId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/history?entityId=${sceneId}&entityType=scene`));
      const data = await res.json();
      setVersions(data);
    } catch (e) {
      console.error("[Manuscript] Failed to fetch versions:", e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/search?query=${encodeURIComponent(searchQuery.trim())}`));
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (commitMsg?: string) => {
    if (!activeScene || !editor || editor.isDestroyed) return;
    try {
      const jsonContent = editor.getJSON();
      const contentString = JSON.stringify(jsonContent);

      const summary = commitMsg || `Save Checkpoint (${activeScene.word_count} words)`;
      await fetch(`/api/projects/${projectId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: activeScene.id,
          entityType: "scene",
          content: contentString,
          summary
        })
      });

      const updates = {
        title: activeScene.title,
        content: contentString,
        summary: activeScene.summary,
        povEntityId: activeScene.pov_entity_id,
        purpose: activeScene.purpose,
        conflict: activeScene.conflict,
        outcome: activeScene.outcome,
        wordCount: activeScene.word_count,
        status: activeScene.status,
        mood: activeScene.mood,
        chapterId: activeScene.chapter_id
      };

      const res = await fetch(`/api/projects/${projectId}/scenes/${activeScene.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to save scene");
      
      // Clean up recovery key since DB save succeeded
      localStorage.removeItem(`aevorin_recovery_${activeScene.id}`);

      await onRefreshScenes();
      await fetchVersionHistory(activeScene.id);
      setDirty(false);
      showToast("Scene saved", "success");
    } catch (e) {
      console.error(e);
      showToast("Unable to save changes", "error");
    }
  };

  const handleRestoreRecovery = () => {
    if (!recoveryDraft || !editor || editor.isDestroyed || !activeScene) return;
    try {
      editor.commands.setContent(recoveryDraft.content);
      setActiveScene(prev => prev ? { ...prev, word_count: recoveryDraft.wordCount } : null);
      setDirty(true);
      setRecoveryDraft(null);
      alert("Recovered draft content restored to editor panel successfully! Auto-saving shortly...");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiscardRecovery = () => {
    if (!activeScene) return;
    localStorage.removeItem(`aevorin_recovery_${activeScene.id}`);
    setRecoveryDraft(null);
  };

  const handleRestoreVersion = async (versionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Version Checkpoint?",
      subtitle: "Are you sure you want to restore this scene to this version? Unsaved active draft changes will be replaced.",
      confirmText: "Restore Version",
      danger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/projects/${projectId}/history/restore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ versionId }),
          });
          if (!res.ok) throw new Error("Restore checkpoint failed");
          await onRefreshScenes();
          showToast("Checkpoint successfully restored!", "success");
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleCompareVersion = async (ver: VersionHistory) => {
    try {
      const res = await fetch(apiUrl(`/api/projects/${projectId}/history/${ver.id}`));
      if (!res.ok) throw new Error("Failed to fetch version checkpoint details");
      const data = await res.json();
      
      const oldText = extractPlainTextFromTipTap(data.content);
      const newText = (editor && !editor.isDestroyed) ? editor.getText() : "";
      
      setDiffData({
        versionNumber: ver.version_number,
        oldText,
        newText
      });
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Unable to compute diff", "error");
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newChapterTitle.trim();
    if (!title) return;
    try {
      let created = false;
      try {
        const res = await fetch(`/api/projects/${projectId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) created = true;
      } catch (err) {}

      if (!created) {
        await ManuscriptRepository.createChapter(projectId, title);
      }

      setNewChapterTitle("");
      await onRefreshChapters();
    } catch (e) {
      console.error("[Add Chapter Failed]", e);
    }
  };

  const handleRenameChapterSubmit = async (chapterId: string) => {
    if (!renameTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameTitle.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename chapter");
      setRenamingChapterId(null);
      setRenameTitle("");
      await onRefreshChapters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Chapter?",
      subtitle: "Are you sure you want to delete this chapter? This detaches all scenes inside it.",
      confirmText: "Delete Chapter",
      danger: true,
      onConfirm: async () => {
        try {
          try {
            await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, { method: "DELETE" });
          } catch (err) {}
          
          await db.chapters.delete(chapterId);
          await onRefreshChapters();
          await onRefreshScenes();
          showToast("Chapter deleted", "info");
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleAddScene = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSceneTitle.trim();
    if (!title) return;
    const chapterId = selectedChapterId === "uncategorized" ? null : selectedChapterId;
    try {
      let createdScId = "";
      try {
        const res = await fetch(`/api/projects/${projectId}/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, title }),
        });
        if (res.ok) {
          const data = await res.json();
          createdScId = data.id;
        }
      } catch (err) {}

      if (!createdScId) {
        const sc = await ManuscriptRepository.createScene(projectId, chapterId || "", title);
        createdScId = sc.id;
      }

      setNewSceneTitle("");
      await onRefreshScenes();
      setActiveSceneId(createdScId);
    } catch (e) {
      console.error("[Add Scene Failed]", e);
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Scene?",
      subtitle: "Are you sure you want to delete this scene? This cannot be undone.",
      confirmText: "Delete Scene",
      danger: true,
      onConfirm: async () => {
        try {
          try {
            await fetch(`/api/projects/${projectId}/scenes/${sceneId}`, { method: "DELETE" });
          } catch (err) {}

          await db.scenes.delete(sceneId);
          await db.drafts.delete(`draft_${sceneId}`);
          if (activeSceneId === sceneId) setActiveSceneId(null);
          await onRefreshScenes();
          showToast("Scene deleted", "info");
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleCleanUpDuplicates = async () => {
    try {
      const safeChaps = Array.isArray(chapters) ? chapters : [];
      const ch1s = safeChaps.filter(c => c.title && c.title.trim().toLowerCase().startsWith("chapter 1"));
      
      if (ch1s.length > 1) {
        const extras = ch1s.slice(1);
        for (const chap of extras) {
          try { await fetch(`/api/projects/${projectId}/chapters/${chap.id}`, { method: "DELETE" }); } catch (err) {}
          await db.chapters.delete(chap.id);
        }
        await onRefreshChapters();
        await onRefreshScenes();
        showToast(`Cleaned up ${extras.length} duplicate Chapter 1 entries!`, "success");
      } else {
        showToast("No duplicate Chapter 1 entries found.", "info");
      }
    } catch (e) {
      console.error("[CleanUpDuplicates Error]", e);
    }
  };

  const handleQuickstart = async () => {
    try {
      let chId = "";
      let scId = "";

      try {
        const chRes = await fetch(`/api/projects/${projectId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Chapter 1" }),
        });
        if (chRes.ok) {
          const chData = await chRes.json();
          chId = chData.id;
        }
      } catch (err) {}

      if (!chId) {
        const chap = await ManuscriptRepository.createChapter(projectId, "Chapter 1");
        chId = chap.id;
      }

      await onRefreshChapters();

      try {
        const scRes = await fetch(`/api/projects/${projectId}/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: chId, title: "Untitled Scene" }),
        });
        if (scRes.ok) {
          const scData = await scRes.json();
          scId = scData.id;
        }
      } catch (err) {}

      if (!scId) {
        const sc = await ManuscriptRepository.createScene(projectId, chId, "Untitled Scene");
        scId = sc.id;
      }

      await onRefreshScenes();
      setActiveSceneId(scId);
    } catch (e) {
      console.error("[Quickstart] Error creating first chapter and scene:", e);
    }
  };

  const handleAddSceneToChapter = async (chapterId: string) => {
    setPromptModal({
      isOpen: true,
      title: "New Scene",
      subtitle: "Enter a title for your new scene in this chapter",
      placeholder: "e.g. Scene 1",
      confirmText: "Add Scene",
      onConfirm: (title) => {
        setPromptModal((prev) => ({ ...prev, isOpen: false }));
        if (title.trim()) {
          (async () => {
            try {
              let createdScId = "";
              try {
                const res = await fetch(`/api/projects/${projectId}/scenes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chapterId, title: title.trim() }),
                });
                if (res.ok) {
                  const data = await res.json();
                  createdScId = data.id;
                }
              } catch (err) {}

              if (!createdScId) {
                const sc = await ManuscriptRepository.createScene(projectId, chapterId, title.trim());
                createdScId = sc.id;
              }

              await onRefreshScenes();
              setActiveSceneId(createdScId);
            } catch (e) {
              console.error("[Add Scene to Chapter] Failed:", e);
            }
          })();
        }
      }
    });
  };

  const getProgressPercentage = () => {
    if (!activeScene) return 0;
    return Math.min(Math.round((activeScene.word_count / dailyGoal) * 100), 100);
  };

  const characters = entities.filter(e => e.type === "character");
  const visibleScenes = searchResults !== null ? searchResults : scenes;

  // Guard: TipTap editor not ready yet
  if (!editor) {
    return (
      <div className="manuscript-workspace" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Initializing editor...</p>
      </div>
    );
  }

  return (
    <div className={`manuscript-workspace ${(leftCollapsed && rightCollapsed) ? 'focus-mode-active' : ''} ${isEditorFocused ? 'editor-focused' : ''}`}>
      {/* Left Navigation Tree - transition-hidden in Focus Mode */}
      <aside className={`manuscript-tree ${leftCollapsed ? 'focus-hidden-left' : ''}`}>
          <form onSubmit={handleSearch} className="tree-form search-engine-form">
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search: involving:Marino..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") setSearchResults(null);
              }}
            />
            {searchQuery.trim() !== "" && (
              <button type="submit" className="btn btn-primary btn-sm search-btn">Go</button>
            )}
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Manuscript Drafts</h3>
            {(Array.isArray(chapters) ? chapters : []).length > 1 && (
              <button
                onClick={handleCleanUpDuplicates}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  padding: "0.2rem 0.45rem",
                  cursor: "pointer"
                }}
                title="Clean up empty duplicate Chapter 1 entries"
              >
                🧹 Clean Duplicates
              </button>
            )}
          </div>
          
          <form onSubmit={handleAddChapter} style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="New Chapter Title..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              style={{ flex: 1, padding: "0.45rem 0.65rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.82rem" }}
            />
            <button
              type="submit"
              style={{ background: "#9f8ad0", color: "#fff", border: "none", borderRadius: "6px", padding: "0.45rem 0.75rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
            >
              + Add
            </button>
          </form>

          <div className="tree-list">
            {(Array.isArray(chapters) ? chapters : []).map((ch) => {
              const safeVisible = Array.isArray(visibleScenes) ? visibleScenes : [];
              const chScenes = safeVisible.filter(s => s.chapter_id === ch.id);
              chScenes.sort((a, b) => a.order_index - b.order_index);

              return (
                <ChapterNode
                  key={ch.id}
                  ch={ch}
                  renamingChapterId={renamingChapterId}
                  renameTitle={renameTitle}
                  setRenameTitle={setRenameTitle}
                  handleRenameChapterSubmit={handleRenameChapterSubmit}
                  setRenamingChapterId={setRenamingChapterId}
                  setContextMenuContext={setContextMenuContext}
                  onDeleteChapter={handleDeleteChapter}
                  onAddSceneToChapter={handleAddSceneToChapter}
                >
                  {(Array.isArray(chScenes) ? chScenes : []).map((sc) => (
                    <SceneNode
                      key={sc.id}
                      sc={sc}
                      activeSceneId={activeSceneId}
                      setActiveSceneId={setActiveSceneId}
                      setContextMenuContext={setContextMenuContext}
                      onDeleteScene={handleDeleteScene}
                    />
                  ))}
                </ChapterNode>
              );
            })}

            {(Array.isArray(visibleScenes) ? visibleScenes : []).filter(s => !s.chapter_id).length > 0 && (
              <div className="tree-chapter-group">
                <div className="tree-chapter-header">
                  <strong>Uncategorized Scenes</strong>
                </div>
                <div className="tree-scenes-list">
                  {(Array.isArray(visibleScenes) ? visibleScenes : [])
                    .filter(s => !s.chapter_id)
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((sc) => (
                      <SceneNode
                        key={sc.id}
                        sc={sc}
                        activeSceneId={activeSceneId}
                        setActiveSceneId={setActiveSceneId}
                        setContextMenuContext={setContextMenuContext}
                        onDeleteScene={handleDeleteScene}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAddScene} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.68rem", color: "#e08e6d", fontWeight: 700, textTransform: "uppercase" }}>Add New Scene</div>
            <input
              type="text"
              placeholder="New Scene Title..."
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              style={{ padding: "0.45rem 0.65rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.82rem" }}
            />
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <select
                value={selectedChapterId || "uncategorized"}
                onChange={(e) => setSelectedChapterId(e.target.value === "uncategorized" ? null : e.target.value)}
                style={{ flex: 1, padding: "0.45rem", background: "#1c1b29", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.78rem" }}
              >
                <option value="uncategorized">No Chapter</option>
                {(Array.isArray(chapters) ? chapters : []).map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
              <button
                type="submit"
                style={{ background: "#e08e6d", color: "#fff", border: "none", borderRadius: "6px", padding: "0.45rem 0.75rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
              >
                + Create
              </button>
            </div>
          </form>
        </aside>

      {/* Editor & Metadata Panel */}
      <section className="manuscript-editor-panel">
        {activeScene ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            {recoveryDraft && (
              <div className="alert alert-warning" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                padding: "0.75rem 1.25rem",
                borderRadius: "8px",
                margin: "1rem",
                color: "#f59e0b",
                fontSize: "0.85rem"
              }}>
                <span>
                  <strong>⚠️ Recovered Draft Found.</strong> Last updated: {new Date(recoveryDraft.timestamp).toLocaleTimeString()}.
                  Unsaved changes: {Math.abs(recoveryDraft.wordCount - activeScene.word_count)} words.
                </span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleDiscardRecovery}>Discard</button>
                  <button className="btn btn-primary btn-sm" onClick={handleRestoreRecovery}>Restore Recovery</button>
                  <button 
                    onClick={() => setRecoveryDraft(null)} 
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f59e0b",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      paddingLeft: "0.5rem",
                      minWidth: "44px",
                      minHeight: "44px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Dismiss Warning"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {/* Top Workspace Toolbar Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 1.25rem",
              background: "rgba(20, 19, 29, 0.7)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              flexWrap: "wrap",
              gap: "0.75rem"
            }}>
              {/* Scrivenings Mode Selector */}
              <div style={{ display: "flex", gap: "0.3rem", background: "rgba(0,0,0,0.3)", padding: "0.2rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                {(["scene", "chapter", "book"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setScriveningsMode(mode)}
                    style={{
                      background: scriveningsMode === mode ? "#9f8ad0" : "transparent",
                      color: scriveningsMode === mode ? "#fff" : "rgba(255,255,255,0.6)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.3rem 0.7rem",
                      fontSize: "0.78rem",
                      fontWeight: scriveningsMode === mode ? 700 : 500,
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {mode === "scene" ? "📄 Scene" : mode === "chapter" ? "📖 Chapter" : "📚 Book"}
                  </button>
                ))}
              </div>

              {/* Session Goals & Inspector Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <SessionGoalsWidget currentWordCount={activeScene?.word_count || 0} targetDailyWords={dailyGoal} />

                <button
                  onClick={() => setShowWritingInspector(!showWritingInspector)}
                  style={{
                    background: showWritingInspector ? "rgba(224, 142, 109, 0.2)" : "rgba(255,255,255,0.05)",
                    color: showWritingInspector ? "#e08e6d" : "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  📐 Writing Inspector
                </button>
              </div>
            </div>

            <div className="editor-flex-container">
            {/* Rich Text Editor */}
            <div className="editor-workspace-col">


              {showTypographySettings && (
                <div className="ov-typography-popover">
                  <div className="ov-popover-header">
                    <span>Typography Settings</span>
                    <button className="close-btn" onClick={() => setShowTypographySettings(false)}>×</button>
                  </div>
                  
                  <div className="ov-popover-group">
                    <label>Font Family</label>
                    <select
                      value={preferences.editorFont}
                      onChange={(e) => updatePreferences({ editorFont: e.target.value })}
                    >
                      <option value="Inter">Inter (UI Serifless)</option>
                      <option value="Source Serif 4">Source Serif 4 (Classic)</option>
                      <option value="EB Garamond">EB Garamond (Elegant)</option>
                      <option value="Crimson Pro">Crimson Pro (Editorial)</option>
                    </select>
                  </div>

                  <div className="ov-popover-group">
                    <label>Font Size ({preferences.fontSize}px)</label>
                    <input
                      type="range"
                      min={14}
                      max={26}
                      step={1}
                      value={preferences.fontSize}
                      onChange={(e) => updatePreferences({ fontSize: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="ov-popover-group">
                    <label>Line Height ({preferences.lineHeight})</label>
                    <input
                      type="range"
                      min={1.4}
                      max={2.2}
                      step={0.1}
                      value={preferences.lineHeight}
                      onChange={(e) => updatePreferences({ lineHeight: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="ov-popover-group">
                    <label>Reading Width</label>
                    <select
                      value={readingWidth}
                      onChange={(e) => setReadingWidth(e.target.value as any)}
                    >
                      <option value="compact">Compact (680px)</option>
                      <option value="comfort">Comfort (720px)</option>
                      <option value="wide">Wide (800px)</option>
                    </select>
                  </div>

                  <div className="ov-popover-group">
                    <label>Typewriter Offset ({typewriterOffset}%)</label>
                    <select
                      value={typewriterOffset}
                      onChange={(e) => setTypewriterOffset(parseInt(e.target.value, 10))}
                    >
                      <option value={35}>35% Viewport</option>
                      <option value={40}>40% Viewport</option>
                      <option value={42}>42% (Recommended)</option>
                      <option value={45}>45% Viewport</option>
                      <option value={50}>50% Center</option>
                    </select>
                  </div>

                  <div className="ov-popover-group">
                    <label>Page Width ({preferences.pageWidth}px)</label>
                    <input
                      type="range"
                      min={500}
                      max={900}
                      step={20}
                      value={preferences.pageWidth}
                      onChange={(e) => updatePreferences({ pageWidth: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="ov-popover-group">
                    <label>Paragraph Spacing</label>
                    <div className="spacing-options-row">
                      {['small', 'medium', 'large'].map((space) => (
                        <button
                          key={space}
                          type="button"
                          className={`spacing-opt-btn ${preferences.paragraphSpacing === space ? 'active' : ''}`}
                          onClick={() => updatePreferences({ paragraphSpacing: space as any })}
                        >
                          {space.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ov-popover-group">
                    <label>Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => updatePreferences({ theme: e.target.value })}
                    >
                      <option value="midnight">Midnight Violet</option>
                      <option value="night">Dark Slate</option>
                      <option value="sepia">Warm Sepia</option>
                      <option value="paper">Light Paper</option>
                      <option value="high-contrast">High Contrast</option>
                      <option value="forest">Forest Green</option>
                      <option value="royal">Royal Velvet</option>
                    </select>
                  </div>
                  
                  {/* Typewriter Toggle */}
                  <div className="ov-popover-group" style={{ display: "flex", gap: "0.75rem", alignItems: "center", cursor: "pointer", marginTop: "1rem" }}>
                    <input
                      type="checkbox"
                      id="typewriter-toggle"
                      checked={isTypewriter}
                      onChange={(e) => setIsTypewriter(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "#9f8ad0" }}
                    />
                    <label htmlFor="typewriter-toggle" style={{ margin: 0, cursor: "pointer", fontSize: "0.85rem", color: "#fff" }}>
                      Typewriter Scroll Mode
                    </label>
                  </div>
                </div>
              )}

              {/* Editor Workspace Content */}
              <div className={`editor-textarea-scroll ${isTypewriter ? "typewriter-active" : ""}`} style={{ padding: "3rem 1.5rem" }}>
                <div style={{ maxWidth: preferences.pageWidth || 650, margin: "0 auto" }}>
                  {/* Chapter Header Banner & Breadcrumb */}
                  {(() => {
                    const safeChaps = Array.isArray(chapters) ? chapters : [];
                    const activeChapter = safeChaps.find(c => c.id === activeScene.chapter_id);
                    
                    return (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                        padding: "0.4rem 0.85rem",
                        background: "rgba(159, 138, 208, 0.12)",
                        border: "1px solid rgba(159, 138, 208, 0.25)",
                        borderRadius: "20px",
                        width: "fit-content"
                      }}>
                        <span style={{ color: "#9f8ad0", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          📖 {activeChapter ? activeChapter.title : "Uncategorized Chapter"}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>•</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 500 }}>Scene</span>
                      </div>
                    );
                  })()}

                  <input
                    type="text"
                    value={activeScene.title}
                    onChange={(e) => updateActiveScene({ title: e.target.value })}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      fontFamily: preferences.editorFont || "'Source Serif 4', 'Georgia', serif",
                      fontSize: "2.2rem",
                      fontWeight: "bold",
                      width: "100%",
                      outline: "none",
                      marginBottom: "2rem",
                      padding: 0
                    }}
                    placeholder="Untitled Scene"
                  />
                  <EditorContent editor={editor} className="tiptap-text-area" />
                </div>
              </div>

              {/* Scene Status Bar */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.45rem 1.25rem",
                background: "#14131d",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.5)"
              }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span>Scene {activeScene?.order_index || 1}</span>
                  <span>• Characters: {characters.length}</span>
                  <span>• Mentions: {entities.length}</span>
                  <span>• Words: {(activeScene?.word_count || 0).toLocaleString()}</span>
                </div>
                <div style={{ color: "#34d399", fontWeight: 600 }}>
                  Autosaved ✓
                </div>
              </div>
            </div>

            {/* Writing Inspector Drawer */}
            {showWritingInspector && (
              <WritingInspector
                activeScene={activeScene}
                entities={entities}
                onClose={() => setShowWritingInspector(false)}
              />
            )}

            {/* Sidebar Scene Card Metadata - transition-hidden in Focus Mode */}
            <aside className={`editor-metadata-sidebar ${rightCollapsed ? 'focus-hidden-right' : ''}`}>
                <h4>Scene Story Card</h4>

                {/* Continuity consistency engine warnings */}
                <div className="meta-group consistency-engine-panel" style={{
                  background: "rgba(224, 142, 109, 0.04)",
                  border: "1px solid rgba(224, 142, 109, 0.15)",
                  borderRadius: "10px",
                  padding: "0.85rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#e08e6d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      🛡️ Continuity Engine
                    </div>
                    <span style={{ fontSize: "0.68rem", background: consistencyIssues.length > 0 ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)", color: consistencyIssues.length > 0 ? "#ef4444" : "#34d399", padding: "0.1rem 0.35rem", borderRadius: "4px", fontWeight: "bold" }}>
                      {consistencyIssues.length > 0 ? `${consistencyIssues.length} Warning${consistencyIssues.length === 1 ? "" : "s"}` : "Active"}
                    </span>
                  </div>
                  {consistencyIssues.length === 0 ? (
                    <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", fontStyle: "italic", textAlign: "center", padding: "0.4rem 0" }}>
                      Scan active. Type to check character consistency...
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", maxHeight: "250px", overflowY: "auto", paddingRight: "0.2rem" }}>
                      {(Array.isArray(consistencyIssues) ? consistencyIssues : []).map((issue, idx) => (
                        <div key={idx} style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "6px",
                          padding: "0.55rem 0.65rem",
                          textAlign: "left"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#e08e6d" }}>{issue.characterName}</span>
                            <span style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: "3px", padding: "0.05rem 0.25rem" }}>{issue.type}</span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", marginTop: "0.25rem", lineHeight: 1.35 }}>
                            {issue.message}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", fontStyle: "italic", marginTop: "0.35rem", paddingLeft: "0.35rem", borderLeft: "2px solid rgba(255,255,255,0.15)" }}>
                            "{issue.sentence}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily Goal card */}
                {/* Daily Goal card */}
                <div className="meta-group daily-goal-tracker">
                  <div className="daily-goal-header">
                    <label>Daily Scene Goal</label>
                    <input
                      type="number"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value) || 500)}
                      className="daily-goal-input"
                    />
                  </div>
                  <div className="daily-progress-container">
                    <div className="daily-progress-bar-bg">
                      <div className="daily-progress-bar-fill" style={{ width: `${getProgressPercentage()}%` }} />
                    </div>
                    <div className="daily-progress-stats">
                      <span>{activeScene?.word_count || 0} / {dailyGoal} words</span>
                      <strong className="percentage-badge">{getProgressPercentage()}%</strong>
                    </div>
                  </div>
                </div>

                <div className="meta-group">
                  <label>Status</label>
                  <select
                    value={activeScene?.status || "draft"}
                    onChange={(e) => updateActiveScene({ status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="polished">Polished</option>
                  </select>
                </div>

                <div className="meta-group">
                  <label>Mood</label>
                  <input
                    type="text"
                    placeholder="e.g. Dark / Suspense"
                    value={activeScene?.mood || ""}
                    onChange={(e) => updateActiveScene({ mood: e.target.value })}
                  />
                </div>

                <div className="meta-group">
                  <label>POV Character</label>
                  <select
                    value={activeScene?.pov_entity_id || ""}
                    onChange={(e) => updateActiveScene({ pov_entity_id: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {(Array.isArray(characters) ? characters : []).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="meta-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Scene Purpose</label>
                    <button 
                      className="calm-expand-field-btn"
                      onClick={() => setExpandedField({ field: "purpose", value: activeScene?.purpose || "" })}
                      style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                      🔍 Expand
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Introduce Kai's motive"
                    value={activeScene?.purpose || ""}
                    onChange={(e) => updateActiveScene({ purpose: e.target.value })}
                  />
                </div>

                <div className="meta-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Conflict</label>
                    <button 
                      className="calm-expand-field-btn"
                      onClick={() => setExpandedField({ field: "conflict", value: activeScene?.conflict || "" })}
                      style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                      🔍 Expand
                    </button>
                  </div>
                  <textarea
                    placeholder="What is blocking the POV character's goal?"
                    value={activeScene?.conflict || ""}
                    onChange={(e) => updateActiveScene({ conflict: e.target.value })}
                  />
                </div>

                <div className="meta-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Outcome / Disaster</label>
                    <button 
                      className="calm-expand-field-btn"
                      onClick={() => setExpandedField({ field: "outcome", value: activeScene?.outcome || "" })}
                      style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                      🔍 Expand
                    </button>
                  </div>
                  <textarea
                    placeholder="How does this scene resolve?"
                    value={activeScene?.outcome || ""}
                    onChange={(e) => updateActiveScene({ outcome: e.target.value })}
                  />
                </div>

                {/* Version Snapshots */}
                <div className="meta-group version-snapshots-box">
                  <label>Version History Checkpoints</label>
                  
                  <div className="manual-checkpoint-form">
                    <input
                      type="text"
                      placeholder="Snapshot label..."
                      value={checkpointSummary}
                      onChange={(e) => setCheckpointSummary(e.target.value)}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (!checkpointSummary.trim()) return;
                        handleSave(checkpointSummary.trim());
                        setCheckpointSummary("");
                      }}
                      style={{ marginTop: "0.25rem", width: "100%" }}
                    >
                      Commit Snapshot
                    </button>
                  </div>

                  <div className="versions-list-scroll">
                    {(Array.isArray(versions) ? versions : []).map((ver) => (
                      <div key={ver.id} className="version-restore-item">
                        <div className="version-meta">
                          <strong>V{ver.version_number}</strong>
                          <span>{ver.summary}</span>
                          <small>{new Date(ver.created_at).toLocaleTimeString()}</small>
                        </div>
                        <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
                          <button className="btn btn-secondary btn-xs" onClick={() => handleCompareVersion(ver)}>Compare</button>
                          <button className="btn btn-secondary btn-xs" onClick={() => handleRestoreVersion(ver.id)}>Restore</button>
                        </div>
                      </div>
                    ))}
                    {versions.length === 0 && (
                      <p className="no-versions">No checkpoints saved.</p>
                    )}
                  </div>
                </div>
              </aside>
          </div>
          </div>
        ) : (
          chapters.length === 0 && scenes.length === 0 ? (
            <div className="onboarding-welcome-pane">
              <div className="onboarding-welcome-card">
                <span className="welcome-emoji">✨</span>
                <h2>Welcome to AEVORIN</h2>
                <p className="welcome-tagline">Your story begins here.</p>
                <p className="welcome-desc">
                  AEVORIN is an offline-first professional writing environment designed to help you plan, draft, and organize your novels.
                </p>
                <div className="onboarding-actions">
                  <button className="btn btn-primary btn-lg quickstart-btn" onClick={handleQuickstart}>
                    Create Chapter 1 & Start Writing
                  </button>
                  {onSeedExample && (
                    <button className="btn btn-secondary btn-lg seed-btn" onClick={onSeedExample}>
                      Load Example Novel
                    </button>
                  )}
                </div>
                <div className="onboarding-footer">
                  <span>or create chapters and scenes manually using the sidebar.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-scene-loaded" style={{ padding: "3rem", textAlign: "center" }}>
              <span className="icon" style={{ fontSize: "3rem" }}>✍️</span>
              <h3 style={{ color: "#fff", marginTop: "1rem" }}>No Active Scene Selected</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "400px", margin: "0.5rem auto 1.5rem auto" }}>
                Select a scene from the left navigation tree or click the button below to start writing immediately.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  if (scenes.length > 0) {
                    setActiveSceneId(scenes[0].id);
                  } else {
                    handleQuickstart();
                  }
                }}
                style={{ background: "#9f8ad0", color: "#fff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                ✏️ Start Writing Now
              </button>
            </div>
          )
        )}
      </section>

      {/* Keyboard Shortcuts Dialog Modal Overlay */}
      {showShortcutsHelp && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: "450px", width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>AEVORIN Keyboard Shortcuts</h2>
              <button className="close-onboarding" onClick={() => setShowShortcutsHelp(false)} style={{ position: "static" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", margin: "1.5rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>Save Active Scene</span>
                <kbd style={{ background: "#334155", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Ctrl + S</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>Focus Sidebar Search Query</span>
                <kbd style={{ background: "#334155", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Ctrl + F</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>Toggle Focus Mode (Full screen)</span>
                <kbd style={{ background: "#334155", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Ctrl + O</kbd>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowShortcutsHelp(false)}>Close Help</button>
          </div>
        </div>
      )}

      {/* Version Comparison Diff Modal */}
      {diffData && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "2rem"
        }}>
          <div className="card" style={{
            maxWidth: "900px",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            textAlign: "left"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                Compare Draft: Current vs. V{diffData.versionNumber}
              </h2>
              <button className="close-onboarding" onClick={() => setDiffData(null)} style={{ position: "static" }}>×</button>
            </div>

            {/* Toggle Controls */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                className={`btn btn-sm ${diffViewMode === "inline" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setDiffViewMode("inline")}
              >
                Inline View
              </button>
              <button
                className={`btn btn-sm ${diffViewMode === "side-by-side" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setDiffViewMode("side-by-side")}
              >
                Side-by-Side
              </button>
            </div>

            {/* Diff content container */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              background: "var(--bg-secondary)",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-serif)",
              fontSize: "1.05rem",
              lineHeight: "1.6",
              maxHeight: "60vh"
            }}>
              {diffViewMode === "inline" ? (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {computeDiff(diffData.oldText, diffData.newText).changes.map((c, idx) => {
                    if (c.type === "insert") {
                      return (
                        <ins key={idx} style={{
                          background: "rgba(16, 185, 129, 0.25)",
                          color: "#34d399",
                          textDecoration: "none",
                          borderRadius: "2px",
                          padding: "0 2px"
                        }}>
                          {c.text}
                        </ins>
                      );
                    } else if (c.type === "delete") {
                      return (
                        <del key={idx} style={{
                          background: "rgba(239, 68, 68, 0.25)",
                          color: "#f87171",
                          textDecoration: "line-through",
                          borderRadius: "2px",
                          padding: "0 2px"
                        }}>
                          {c.text}
                        </del>
                      );
                    } else {
                      return <span key={idx}>{c.text}</span>;
                    }
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  {/* Left Side: Old text */}
                  <div style={{ flex: 1, whiteSpace: "pre-wrap", borderRight: "1px solid var(--border-color)", paddingRight: "1rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Previous Checkpoint (V{diffData.versionNumber})</div>
                    <div>{diffData.oldText}</div>
                  </div>
                  {/* Right Side: New text */}
                  <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Current Draft</div>
                    <div>{diffData.newText}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setDiffData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Expandable Scene Story Card field Modal */}
      {expandedField && (
        <div className="calm-modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div className="calm-creation-dialog animate-scale-in" style={{ width: "90%", maxWidth: "600px", padding: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontFamily: "var(--font-editor)" }}>
              Edit Scene {expandedField.field.charAt(0).toUpperCase() + expandedField.field.slice(1)}
            </h3>
            <div className="form-group" style={{ margin: "1.5rem 0" }}>
              <textarea
                value={expandedField.value}
                onChange={(e) => setExpandedField({ ...expandedField, value: e.target.value })}
                style={{
                  width: "100%",
                  height: "250px",
                  fontFamily: "var(--font-editor)",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  padding: "0.75rem",
                  background: "#0c101d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  color: "#fff"
                }}
                placeholder={`Flesh out the scene ${expandedField.field} details...`}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setExpandedField(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await updateActiveScene({ [expandedField.field]: expandedField.value });
                setExpandedField(null);
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating distraction-free control panel menu */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(33, 33, 33, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "30px",
        padding: "0.5rem 1.25rem",
        display: "flex",
        gap: "1.75rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 999,
        alignItems: "center"
      }}>
        {/* Toggle Left Outline Panel */}
        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          style={{
            background: "none",
            border: "none",
            color: !leftCollapsed ? "#e08e6d" : "rgba(255,255,255,0.5)",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "color 0.2s"
          }}
          title={leftCollapsed ? "Show Outline Sidebar" : "Hide Outline Sidebar"}
        >
          📂
        </button>

        {/* Typography Preferences button */}
        <button
          onClick={() => setShowTypographySettings(!showTypographySettings)}
          style={{
            background: "none",
            border: "none",
            color: showTypographySettings ? "#e08e6d" : "rgba(255,255,255,0.5)",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "color 0.2s"
          }}
          title="Typography Settings"
        >
          Aa
        </button>
        
        {/* Toggle Right Scene Card Panel */}
        <button
          onClick={() => setRightCollapsed(!rightCollapsed)}
          style={{
            background: "none",
            border: "none",
            color: !rightCollapsed ? "#e08e6d" : "rgba(255,255,255,0.5)",
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "color 0.2s"
          }}
          title={rightCollapsed ? "Show Scene Card Details" : "Hide Scene Card Details"}
        >
          📝
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.15)" }} />

        {/* Menu Drawer Toggle button */}
        <button
          onClick={() => {
            setSidebarOpen(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: "1.15rem",
            cursor: "pointer",
            transition: "color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Open Workspace Menu"
        >
          ☰
        </button>
      </div>

      <BottomSheet isOpen={contextMenuContext !== null} onClose={() => setContextMenuContext(null)} title={contextMenuContext ? `Options for ${contextMenuContext.title}` : ""}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
          {contextMenuContext?.type === "chapter" && (
            <Button variant="secondary" onClick={() => {
              setRenamingChapterId(contextMenuContext.id);
              setRenameTitle(contextMenuContext.title);
              setContextMenuContext(null);
            }}>
              Rename Chapter
            </Button>
          )}
          <Button variant="secondary" onClick={() => {
            if (contextMenuContext?.type === "chapter") {
              handleAddSceneToChapter(contextMenuContext.id);
            } else if (contextMenuContext?.type === "scene") {
              // Add a scene after this one? For now, we only have global add scene
            }
            setContextMenuContext(null);
          }}>
            {contextMenuContext?.type === "chapter" ? "Add Scene" : "Cancel"}
          </Button>
          <Button variant="danger" onClick={() => {
            if (contextMenuContext?.type === "chapter") handleDeleteChapter(contextMenuContext.id);
            else if (contextMenuContext?.type === "scene") handleDeleteScene(contextMenuContext.id);
            setContextMenuContext(null);
          }}>
            Delete {contextMenuContext?.type === "chapter" ? "Chapter" : "Scene"}
          </Button>
        </div>
      </BottomSheet>

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        subtitle={promptModal.subtitle}
        placeholder={promptModal.placeholder}
        confirmText={promptModal.confirmText}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {confirmModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10, 9, 18, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999
        }}>
          <div style={{
            background: "#181726",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "14px",
            padding: "1.75rem",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
              {confirmModal.danger ? "⚠️" : "❓"}
            </div>
            <h3 style={{ color: "#fff", margin: "0 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 700 }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              {confirmModal.subtitle}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                style={{
                  background: confirmModal.danger ? "#ef4444" : "#818cf8",
                  color: "#fff",
                  border: "none",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
