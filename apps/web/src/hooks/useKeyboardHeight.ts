import { useEffect, useState } from 'react';

/**
 * Returns the current on-screen keyboard height in pixels.
 * Uses the visualViewport API (supported in all modern browsers).
 * Returns 0 when no keyboard is visible.
 *
 * Works on:
 * - Android Chrome (keyboard shrinks visualViewport.height)
 * - iOS Safari (keyboard shrinks visualViewport.height)
 * - Desktop (always returns 0)
 */
export const useKeyboardHeight = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      // keyboard height = difference between layout viewport and visual viewport
      const newHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardHeight(newHeight);
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);

    // Initialize
    handleViewportChange();

    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // After keyboard height changes and React re-renders with new padding,
  // scroll the focused input into view. Debounced so it fires once the
  // keyboard animation settles (height stops changing for 150ms).
  useEffect(() => {
    if (keyboardHeight <= 0) return;

    const timer = setTimeout(() => {
      const activeEl = document.activeElement as HTMLElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [keyboardHeight]);

  return keyboardHeight;
};
