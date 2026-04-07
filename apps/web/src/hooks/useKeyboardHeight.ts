import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detects the on-screen keyboard and returns styles to make a fixed-bottom
 * drawer fill the visible area above the keyboard.
 *
 * Handles two browser behaviors:
 * - iOS Safari: window.innerHeight stays fixed, visualViewport.height shrinks.
 *   keyboardHeight > 0, need to push drawer up by that amount.
 * - Android Chrome (Galaxy S24): window.innerHeight AND visualViewport.height
 *   both shrink together, so keyboardHeight ≈ 0. We detect keyboard open by
 *   comparing current viewport height against the initial (pre-keyboard) height.
 */
interface UseKeyboardHeightResult {
  keyboardHeight: number;
  isKeyboardOpen: boolean;
  drawerStyle: (baseMaxHeight: string) => React.CSSProperties;
}

export const useKeyboardHeight = (): UseKeyboardHeightResult => {
  // iOS: gap between layout viewport and visual viewport
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // true on both iOS (keyboardHeight > 0) and Android (viewport shrank)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  // The visible viewport height when keyboard is open (used for drawer sizing)
  const [visibleHeight, setVisibleHeight] = useState(0);

  // Capture the "resting" viewport height before any keyboard appears
  const initialHeightRef = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Store the baseline height (no keyboard) on mount
    initialHeightRef.current = vv.height;

    const handleViewportChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // iOS: window.innerHeight fixed, vv.height shrinks → gap = keyboard height
        const iosKeyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

        // Android: both window.innerHeight and vv.height shrink together,
        // so iosKeyboard ≈ 0. Detect via significant drop from initial height.
        const androidKeyboard = iosKeyboard === 0 && vv.height < initialHeightRef.current - 120;

        const open = iosKeyboard > 50 || androidKeyboard;

        setKeyboardHeight(iosKeyboard);
        setIsKeyboardOpen(open);
        if (open) setVisibleHeight(vv.height);
      });
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scroll focused input into view when keyboard opens (user-initiated focus only)
  useEffect(() => {
    if (!isKeyboardOpen) return;

    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isKeyboardOpen]);

  const drawerStyle = useCallback(
    (baseMaxHeight: string): React.CSSProperties => {
      if (!isKeyboardOpen) return { maxHeight: baseMaxHeight };

      if (keyboardHeight > 50) {
        // iOS: push drawer up above the keyboard, fill the visual viewport
        return {
          bottom: keyboardHeight,
          maxHeight: `${visibleHeight}px`,
        };
      } else {
        // Android: viewport already shrank to exclude keyboard.
        // Fill 100% of the now-smaller viewport (= full screen above keyboard).
        return {
          bottom: 0,
          maxHeight: '100dvh',
        };
      }
    },
    [isKeyboardOpen, keyboardHeight, visibleHeight]
  );

  return { keyboardHeight, isKeyboardOpen, drawerStyle };
};
