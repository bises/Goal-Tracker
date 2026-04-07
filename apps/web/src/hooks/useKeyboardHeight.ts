import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Returns the current on-screen keyboard height and a helper that
 * produces `bottom` / `maxHeight` styles for a fixed-bottom drawer so it
 * stays above the virtual keyboard on mobile.
 *
 * Works on:
 * - Android Chrome (keyboard shrinks visualViewport.height)
 * - iOS Safari (keyboard shrinks visualViewport.height)
 * - Desktop (always returns 0)
 */
interface UseKeyboardHeightResult {
  keyboardHeight: number;
  /** Merge into the Drawer.Content `style` prop. */
  drawerStyle: (baseMaxHeight: string) => React.CSSProperties;
}

export const useKeyboardHeight = (): UseKeyboardHeightResult => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      const newHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardHeight(newHeight);
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Scroll focused input into view when keyboard appears / height changes
  useEffect(() => {
    if (keyboardHeight <= 0) return;

    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    return () => clearTimeout(scrollTimerRef.current);
  }, [keyboardHeight]);

  const drawerStyle = useCallback(
    (baseMaxHeight: string): React.CSSProperties => {
      if (keyboardHeight <= 0) return { maxHeight: baseMaxHeight };
      return {
        bottom: keyboardHeight,
        maxHeight: `calc(${baseMaxHeight} - ${keyboardHeight}px)`,
      };
    },
    [keyboardHeight]
  );

  return { keyboardHeight, drawerStyle };
};
