import React, { createContext, useContext, useState, useEffect } from "react";
import { apiUrl } from "../../lib/api";
import { useBackHandler } from "../navigation/useBackHandler";
import { BACK_PRIORITY } from "../navigation/BackPriority";
import { useNavigation } from "../navigation/NavigationContext";

export interface FocusedEntity {
  type: "character" | "thread" | "relationship" | "theme" | "chapter" | "location";
  id: string;
  name: string;
}

interface StoryRoomContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  focusStack: FocusedEntity[];
  setFocusStack: React.Dispatch<React.SetStateAction<FocusedEntity[]>>;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPosition: string | null;
  setSelectedPosition: (pos: string | null) => void;
  lastViewMode: string;
  setLastViewMode: (mode: string) => void;
  graphZoom: number;
  setGraphZoom: (zoom: number) => void;
  graphDepth: number;
  setGraphDepth: (depth: number) => void;
  pushFocus: (entity: FocusedEntity) => void;
  popFocus: () => void;
  clearFocus: () => void;
  loadingState: boolean;
}

const StoryRoomContext = createContext<StoryRoomContextType | undefined>(undefined);

export const useStoryRoom = () => {
  const context = useContext(StoryRoomContext);
  if (!context) throw new Error("useStoryRoom must be used within a StoryRoomProvider");
  return context;
};

interface StoryRoomProviderProps {
  projectId: string;
  children: React.ReactNode;
}

export const StoryRoomProvider: React.FC<StoryRoomProviderProps> = ({ projectId, children }) => {
  const [activeTab, setActiveTabState] = useState<string>("story");
  const [focusStack, setFocusStack] = useState<FocusedEntity[]>([]);
  const [filters, setFilters] = useState<string[]>(["chapters", "scenes"]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [lastViewMode, setLastViewMode] = useState<string>("chapters_only");
  const [graphZoom, setGraphZoom] = useState<number>(1.0);
  const [graphDepth, setGraphDepth] = useState<number>(1);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  const { pushNavigation } = useNavigation();

  // Load state from backend on mount/projectId change
  useEffect(() => {
    let active = true;
    setLoadingState(true);

    fetch(apiUrl(`/api/projects/${projectId}/state`))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch state");
        return res.json();
      })
      .then((data) => {
        if (!active || !data) return;

        if (data.active_tab) setActiveTabState(data.active_tab);
        if (data.focused_entity_json) {
          try {
            setFocusStack(JSON.parse(data.focused_entity_json));
          } catch (e) {
            console.error(e);
          }
        }
        if (data.graph_zoom !== undefined) setGraphZoom(data.graph_zoom);
        if (data.graph_depth !== undefined) setGraphDepth(data.graph_depth);
        if (data.timeline_position_key) setSelectedPosition(data.timeline_position_key);
        if (data.last_view_mode) {
          setLastViewMode(data.last_view_mode);
          // Apply filters presets based on saved view mode
          if (data.last_view_mode === "full_narrative") {
            setFilters(["chapters", "scenes", "characters", "relationships", "world", "mysteries", "themes", "intent", "emotional"]);
          } else {
            setFilters(["chapters", "scenes"]);
          }
        }
      })
      .catch((err) => console.warn("[StoryRoomProvider] No workspace state loaded: ", err))
      .finally(() => {
        if (active) setLoadingState(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  // Persist state to backend when modifications occur (debounced save)
  useEffect(() => {
    if (loadingState) return;

    const timer = setTimeout(() => {
      fetch(apiUrl(`/api/projects/${projectId}/state`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeTab,
          focusedEntityJson: JSON.stringify(focusStack),
          graphZoom,
          graphDepth,
          timelinePositionKey: selectedPosition,
          lastViewMode,
        }),
      }).catch((e) => console.error("[StoryRoomProvider] Error saving workspace state:", e));
    }, 800); // 800ms debounce save

    return () => clearTimeout(timer);
  }, [projectId, activeTab, focusStack, graphZoom, graphDepth, selectedPosition, lastViewMode, loadingState]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  const pushFocus = (entity: FocusedEntity) => {
    setFocusStack((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === entity.id) {
        return prev;
      }
      pushNavigation("PUSH_FOCUS", "story_room", { target: entity.id });
      return [...prev, entity];
    });
  };

  const popFocus = () => {
    setFocusStack((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  const clearFocus = () => {
    setFocusStack([]);
  };

  useBackHandler({
    id: "story_room_focus_stack",
    priority: BACK_PRIORITY.GRAPH_FOCUS,
    isActive: focusStack.length > 0,
    onBack: () => {
      popFocus();
      return true;
    }
  });

  return (
    <StoryRoomContext.Provider
      value={{
        activeTab,
        setActiveTab,
        focusStack,
        setFocusStack,
        filters,
        setFilters,
        selectedPosition,
        setSelectedPosition,
        lastViewMode,
        setLastViewMode,
        graphZoom,
        setGraphZoom,
        graphDepth,
        setGraphDepth,
        pushFocus,
        popFocus,
        clearFocus,
        loadingState,
      }}
    >
      {children}
    </StoryRoomContext.Provider>
  );
};
