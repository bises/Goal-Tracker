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

  return keyboardHeight;
};
