import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger a swipe
  ignoreSelector?: string; // CSS selector of elements to ignore swipes on
}

export function useSwipeGesture(ref: React.RefObject<HTMLElement>, options: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const minSwipeDistance = options.threshold || 50;

    const onTouchStart = (e: TouchEvent) => {
      // Check if the target or its parents match the ignore selector
      if (options.ignoreSelector && (e.target as Element).closest?.(options.ignoreSelector)) {
        touchStart.current = null;
        return;
      }
      // Globally ignore inputs and textareas
      if ((e.target as Element).closest?.('input, textarea, select, [contenteditable="true"]')) {
        touchStart.current = null;
        return;
      }

      touchEnd.current = null;
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;

      const dx = touchEnd.current.x - touchStart.current.x;
      const dy = touchEnd.current.y - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Check if it's a primary horizontal swipe
      if (absDx > absDy && absDx > minSwipeDistance) {
        if (dx > 0 && options.onSwipeRight) {
          options.onSwipeRight();
        } else if (dx < 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        }
      } 
      // Check if it's a primary vertical swipe
      else if (absDy > absDx && absDy > minSwipeDistance) {
        if (dy > 0 && options.onSwipeDown) {
          options.onSwipeDown();
        } else if (dy < 0 && options.onSwipeUp) {
          options.onSwipeUp();
        }
      }

      touchStart.current = null;
      touchEnd.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, options]);
}
