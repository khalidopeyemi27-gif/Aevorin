import React, { createContext, useContext, useState } from "react";
import { useBackHandler } from "../navigation/useBackHandler";
import { BACK_PRIORITY } from "../navigation/BackPriority";
import { useNavigation } from "../navigation/NavigationContext";
export interface ProjectData {
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

export type WorkspaceTab = "overview" | "manuscript" | "story" | "matrix" | "character" | "world" | "timeline" | "history" | "rules" | "backups" | "export" | "help" | "analytics" | "knowledge" | "graph" | "journey";

interface WorkspaceStoreType {
  selectedProject: ProjectData | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  activeTab: WorkspaceTab;
  sidebarOpen: boolean;
  focusMode: boolean;
  
  setSelectedProject: (project: ProjectData | null) => void;
  setSelectedChapterId: (chapterId: string | null) => void;
  setSelectedSceneId: (sceneId: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSidebarOpen: (open: boolean) => void;
  setFocusMode: (active: boolean) => void;
}

const WorkspaceStoreContext = createContext<WorkspaceStoreType | undefined>(undefined);

export function WorkspaceStoreProvider({ children }: { children: React.ReactNode }) {
  const [selectedProject, setSelectedProjectState] = useState<ProjectData | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<WorkspaceTab>("story");
  const [tabHistory, setTabHistory] = useState<WorkspaceTab[]>(["story"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const { pushNavigation } = useNavigation();

  useBackHandler({
    id: "workspace_editor",
    priority: BACK_PRIORITY.EDITOR,
    isActive: activeTab === "manuscript" && (selectedChapterId !== null || selectedSceneId !== null),
    onBack: () => {
      setSelectedChapterId(null);
      setSelectedSceneId(null);
      
      if (tabHistory.length > 1) {
        const newHistory = [...tabHistory];
        newHistory.pop(); // Remove "manuscript"
        const previousTab = newHistory[newHistory.length - 1];
        setTabHistory(newHistory);
        setActiveTabState(previousTab);
      } else {
        setActiveTabState("story");
        setTabHistory(["story"]);
      }
      return true;
    }
  });

  useBackHandler({
    id: "workspace_tab_history",
    priority: BACK_PRIORITY.STORY_ROOM_TAB,
    isActive: activeTab !== "overview" && tabHistory.length > 1,
    onBack: () => {
      const newHistory = [...tabHistory];
      newHistory.pop(); // Remove current
      const previousTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      setActiveTabState(previousTab);
      return true;
    }
  });

  useBackHandler({
    id: "workspace_to_overview",
    priority: BACK_PRIORITY.STORY_ROOM_TAB + 5,
    isActive: activeTab === "story" && tabHistory.length <= 1,
    onBack: () => {
      setActiveTabState("overview");
      return true;
    }
  });

  // Sync selectedProject memory
  const setSelectedProject = (project: ProjectData | null) => {
    setSelectedProjectState(project);
    if (!project) {
      setSelectedChapterId(null);
      setSelectedSceneId(null);
      setActiveTabState("story");
      setTabHistory(["story"]);
      setSidebarOpen(false);
      setFocusMode(false);
    }
  };

  const handleSetSelectedChapterId = (chapterId: string | null) => {
    if (chapterId && chapterId !== selectedChapterId) {
      pushNavigation("OPEN_CHAPTER", "editor", { id: chapterId });
    }
    setSelectedChapterId(chapterId);
  };

  const handleSetSelectedSceneId = (sceneId: string | null) => {
    if (sceneId && sceneId !== selectedSceneId) {
      pushNavigation("OPEN_SCENE", "editor", { id: sceneId });
    }
    setSelectedSceneId(sceneId);
  };

  const handleSetActiveTab = (tab: WorkspaceTab) => {
    if (tab !== activeTab) {
      pushNavigation("OPEN_TAB", "workspace", { tab });
      setTabHistory(prev => {
        if (prev[prev.length - 1] === tab) return prev;
        // Don't let history get too massive
        const newHist = [...prev, tab];
        if (newHist.length > 15) newHist.shift();
        return newHist;
      });
    }
    setActiveTabState(tab);
  };

  return (
    <WorkspaceStoreContext.Provider
      value={{
        selectedProject,
        selectedChapterId,
        selectedSceneId,
        activeTab,
        sidebarOpen,
        focusMode,
        setSelectedProject,
        setSelectedChapterId: handleSetSelectedChapterId,
        setSelectedSceneId: handleSetSelectedSceneId,
        setActiveTab: handleSetActiveTab,
        setSidebarOpen,
        setFocusMode,
      }}
    >
      {children}
    </WorkspaceStoreContext.Provider>
  );
}

export function useWorkspaceStore() {
  const context = useContext(WorkspaceStoreContext);
  if (!context) {
    throw new Error("useWorkspaceStore must be used within a WorkspaceStoreProvider");
  }
  return context;
}
