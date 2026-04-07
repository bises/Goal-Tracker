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
  const rafRef = useRef<number>();

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      // Use rAF to batch rapid resize events during keyboard animation
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const newHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        setKeyboardHeight(newHeight);
      });
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // When the keyboard is visible and user focuses an input,
  // scroll it into view inside its nearest scroll container.
  useEffect(() => {
    if (keyboardHeight <= 0) return;

    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        // Wait for layout to settle after keyboard resize
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
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
