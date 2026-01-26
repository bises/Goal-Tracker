import { useRef } from 'react';

interface UseTouchHandlersOptions {
  onTap?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
  movementThreshold?: number;
  disabled?: boolean;
}

/**
 * Custom hook for handling mobile touch interactions with tap and long press detection.
 *
 * @param options Configuration options
 * @param options.onTap Callback fired when a quick tap is detected (touch released before longPressDelay without movement)
 * @param options.onLongPress Callback fired when a long press is detected (touch held for longPressDelay)
 * @param options.longPressDelay Time in ms to hold before triggering long press (default: 500)
 * @param options.movementThreshold Distance in px that cancels tap/long press (default: 10)
 * @param options.disabled Whether touch handlers are disabled (default: false)
 *
 * @returns Object with touch event handlers to spread on your element
 *
 * @example
 * const touchHandlers = useTouchHandlers({
 *   onTap: () => console.log('Tapped!'),
 *   onLongPress: () => console.log('Long pressed!')
 * });
 *
 * <div {...touchHandlers}>Touch me</div>
 */
export function useTouchHandlers({
  onTap,
  onLongPress,
  longPressDelay = 500,
  movementThreshold = 10,
  disabled = false,
}: UseTouchHandlersOptions = {}) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    // Store initial touch position
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    // Start timer for long-press detection
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        longPressTimerRef.current = null;
      }, longPressDelay);
    }

    // Prevent default behaviors like text selection or context menu (only if cancelable)
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStartPos.current || !longPressTimerRef.current) return;

    // Check if finger moved more than threshold - if so, cancel long press
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    const moved = deltaX > movementThreshold || deltaY > movementThreshold;

    if (moved) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;

    // Check if finger moved more than threshold
    const touch = e.changedTouches[0];
    const startPos = touchStartPos.current;

    if (startPos) {
      const deltaX = Math.abs(touch.clientX - startPos.x);
      const deltaY = Math.abs(touch.clientY - startPos.y);
      const moved = deltaX > movementThreshold || deltaY > movementThreshold;

      // If timer is still running, it was a quick release (tap)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;

        // Only trigger tap if finger didn't move
        if (!moved && onTap) {
          onTap();
        }
      }
    }

    // Reset touch position
    touchStartPos.current = null;

    // Prevent onClick from firing on mobile after touch events (only if cancelable)
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  if (disabled) {
    return {};
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
