export type NavigationAction =
  | "OPEN_PROJECT"
  | "OPEN_CHAPTER"
  | "OPEN_SCENE"
  | "OPEN_TAB"
  | "PUSH_FOCUS"
  | "SELECT_CHARACTER"
  | "OPEN_MODAL";

export interface NavigationState {
  aevorin: true;
  level: "dashboard" | "workspace" | "story_room" | "editor";
  action: NavigationAction;
  target?: {
    type: string;
    id: string;
    [key: string]: any;
  };
  timestamp: number;
}

export interface BackHandlerResponse {
  allow: boolean;
  reason?: string;
}

export interface BackHandler {
  id: string;
  priority: number;
  canExit?: boolean; // If true, indicates this handler can exit the app if it's the root
  beforeBack?: () => Promise<BackHandlerResponse> | BackHandlerResponse;
  onBack: () => Promise<boolean> | boolean; // Returns true if consumed, false to continue to next handler
  onForward?: () => void;
}
