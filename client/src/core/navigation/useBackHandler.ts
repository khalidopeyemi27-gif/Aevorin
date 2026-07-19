import { useEffect, useRef } from "react";
import { useNavigation } from "./NavigationContext";
import type { BackHandler, BackHandlerResponse } from "./NavigationTypes";

export interface UseBackHandlerOptions {
  id: string;
  priority: number;
  isActive: boolean;
  canExit?: boolean;
  beforeBack?: () => Promise<BackHandlerResponse> | BackHandlerResponse;
  onBack: () => Promise<boolean> | boolean;
}

export function useBackHandler({
  id,
  priority,
  isActive,
  canExit,
  beforeBack,
  onBack,
}: UseBackHandlerOptions) {
  const { registerBackHandler } = useNavigation();

  // Use refs to ensure we always call the latest callbacks without needing to re-register
  const onBackRef = useRef(onBack);
  const beforeBackRef = useRef(beforeBack);

  useEffect(() => {
    onBackRef.current = onBack;
    beforeBackRef.current = beforeBack;
  }, [onBack, beforeBack]);

  useEffect(() => {
    if (!isActive) return;

    const unregister = registerBackHandler({
      id,
      priority,
      canExit,
      beforeBack: () => (beforeBackRef.current ? beforeBackRef.current() : { allow: true }),
      onBack: () => onBackRef.current(),
    });

    return () => unregister();
  }, [isActive, id, priority, canExit, registerBackHandler]);
}
