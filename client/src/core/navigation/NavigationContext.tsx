import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { BackHandler, NavigationAction, NavigationState } from "./NavigationTypes";

interface NavigationContextType {
  pushNavigation: (
    action: NavigationAction,
    level: NavigationState["level"],
    target?: Record<string, any>
  ) => void;
  registerBackHandler: (handler: BackHandler) => () => void;
  goBack: () => Promise<void>;
  getActiveHandlers: () => BackHandler[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within a NavigationProvider");
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeHandlersState, setActiveHandlersState] = useState<BackHandler[]>([]);
  // We keep a ref for immediate access in event listeners
  const activeHandlers = useRef<BackHandler[]>([]);
  
  // Track if we are currently handling a back action to prevent infinite loops
  const isHandlingBack = useRef(false);

  const registerBackHandler = (handler: BackHandler) => {
    // Insert handler while keeping array sorted by priority (lowest number first)
    const newHandlers = [...activeHandlers.current, handler].sort((a, b) => a.priority - b.priority);
    activeHandlers.current = newHandlers;
    setActiveHandlersState(newHandlers);
    
    return () => {
      const filtered = activeHandlers.current.filter((h) => h.id !== handler.id);
      activeHandlers.current = filtered;
      setActiveHandlersState(filtered);
    };
  };

  const getActiveHandlers = () => activeHandlersState;

  const pushNavigation = (
    action: NavigationAction,
    level: NavigationState["level"],
    target?: Record<string, any>
  ) => {
    const state: NavigationState = {
      aevorin: true,
      level,
      action,
      target,
      timestamp: Date.now(),
    };
    
    // We push to history to create a physical "back" entry for the browser/Android WebView
    window.history.pushState(state, "");
  };

  const goBack = async () => {
    if (isHandlingBack.current) return;
    isHandlingBack.current = true;

    try {
      let consumed = false;
      
      // We iterate over the sorted handlers. The lowest priority number runs first.
      for (const handler of activeHandlers.current) {
        if (handler.beforeBack) {
          const res = await handler.beforeBack();
          if (!res.allow) {
            // A handler refused to back (e.g., save failed, validation error).
            // We need to re-push the state to undo the native popstate.
            console.warn(`Back cancelled by handler ${handler.id}: ${res.reason}`);
            window.history.pushState({ aevorin: true, timestamp: Date.now() }, "");
            return;
          }
        }

        const didConsume = await handler.onBack();
        if (didConsume) {
          consumed = true;
          // Re-push a history state to trap the next back gesture
          window.history.pushState({ aevorin: true, timestamp: Date.now() }, "");
          break; // Stop propagation since this handler consumed the back event
        }
      }

      if (!consumed) {
        // If no handler consumed it and there's no native fallback you want to intercept,
        // we might allow it to exit. For an Android app wrapper, letting history pop when 
        // there are no handlers usually exits the app.
      }
    } finally {
      isHandlingBack.current = false;
    }
  };

  useEffect(() => {
    // Initial dummy state so we have something to pop back to
    window.history.replaceState({ aevorin: true, timestamp: Date.now(), initial: true }, "");

    const handlePopState = async (event: PopStateEvent) => {
      // The popstate has ALREADY occurred in the browser at this point.
      // If we go back, we execute our internal goBack router logic.
      // We don't implement full forward yet, so we just treat popstate as a back gesture.
      await goBack();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ pushNavigation, registerBackHandler, goBack, getActiveHandlers }}>
      {children}
    </NavigationContext.Provider>
  );
};
