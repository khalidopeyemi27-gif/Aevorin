import { useCallback, useRef } from 'react';

interface LongPressOptions {
  isPreventDefault?: boolean;
  delay?: number;
}

export function useLongPress(
  onLongPress: (e: any) => void,
  onClick?: (e: any) => void,
  { isPreventDefault = true, delay = 500 }: LongPressOptions = {}
) {
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: any) => {
      // Prevent default context menu on long press on mobile
      if (isPreventDefault && event.target) {
        event.target.addEventListener('contextmenu', preventDefault, {
          once: true,
        });
      }

      timeout.current = setTimeout(() => {
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, isPreventDefault]
  );

  const clear = useCallback(
    (event: any, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      shouldTriggerClick && onClick && onClick(event);

      if (isPreventDefault && target.current) {
        target.current.removeEventListener('contextmenu', preventDefault);
      }
    },
    [onClick, isPreventDefault]
  );

  return {
    onMouseDown: (e: any) => start(e),
    onTouchStart: (e: any) => start(e),
    onMouseUp: (e: any) => clear(e),
    onMouseLeave: (e: any) => clear(e, false),
    onTouchEnd: (e: any) => clear(e),
    onTouchMove: (e: any) => clear(e, false) // cancel if they start scrolling
  };
}

const preventDefault = (e: Event) => {
  if (e.touches && e.touches.length < 2 && e.preventDefault) {
    e.preventDefault();
  }
};
