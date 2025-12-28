"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * useReducedMotion - Accessibility-First Motion Detection (React 18+ Pattern)
 *
 * Uses `useSyncExternalStore` to safely subscribe to the media query
 * without hydration mismatches or synchronous setState in effects.
 *
 * @returns {object} Motion configuration based on user preference
 *
 * @example
 * const { shouldReduceMotion, motionProps, getTransition } = useReducedMotion();
 *
 * // Use in components
 * <motion.div {...motionProps.fade}>Content</motion.div>
 */

export interface ReducedMotionConfig {
  /** Whether the user prefers reduced motion */
  shouldReduceMotion: boolean;
  /** Pre-configured motion props that respect user preference */
  motionProps: {
    fade: {
      initial: { opacity: number };
      animate: { opacity: number };
      exit: { opacity: number };
      transition: { duration: number };
    };
    slide: {
      initial: { opacity: number; y: number };
      animate: { opacity: number; y: number };
      exit: { opacity: number; y: number };
      transition: { duration: number };
    };
    scale: {
      initial: { opacity: number; scale: number };
      animate: { opacity: number; scale: number };
      exit: { opacity: number; scale: number };
      transition: { duration: number };
    };
  };
  /** Get a transition config that respects reduced motion */
  getTransition: (config?: { duration?: number; delay?: number }) => {
    duration: number;
    delay?: number;
    ease?: string;
  };
  /** Get spring physics that respect reduced motion */
  getSpring: () => {
    type: "spring" | "tween";
    stiffness?: number;
    damping?: number;
    duration?: number;
  };
}

// ============================================================================
// Media Query Subscription (External Store Pattern)
// ============================================================================

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribe to the media query changes.
 * This is called by useSyncExternalStore to set up the subscription.
 */
function subscribe(callback: () => void): () => void {
  // SSR guard
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

/**
 * Get the current snapshot of the media query state.
 * Called on every render to check if the value changed.
 */
function getSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * Server snapshot - always returns false (animations enabled by default).
 * This prevents hydration mismatches.
 */
function getServerSnapshot(): boolean {
  return false;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useReducedMotion(): ReducedMotionConfig {
  // Use React 18's useSyncExternalStore for safe subscription
  const shouldReduceMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Memoize motion props to prevent unnecessary re-renders
  const motionProps = useMemo(
    () => ({
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: shouldReduceMotion ? 0.01 : 0.3 },
      },
      slide: {
        initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: shouldReduceMotion ? 0 : -20 },
        transition: { duration: shouldReduceMotion ? 0.01 : 0.4 },
      },
      scale: {
        initial: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
        transition: { duration: shouldReduceMotion ? 0.01 : 0.3 },
      },
    }),
    [shouldReduceMotion]
  );

  const getTransition = useMemo(
    () => (config?: { duration?: number; delay?: number }) => {
      if (shouldReduceMotion) {
        return {
          duration: 0.01,
          delay: config?.delay ?? 0,
        };
      }
      return {
        duration: config?.duration ?? 0.4,
        delay: config?.delay ?? 0,
        ease: "easeOut",
      };
    },
    [shouldReduceMotion]
  );

  const getSpring = useMemo(
    () => () => {
      if (shouldReduceMotion) {
        return {
          type: "tween" as const,
          duration: 0.01,
        };
      }
      return {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
      };
    },
    [shouldReduceMotion]
  );

  return {
    shouldReduceMotion,
    motionProps,
    getTransition,
    getSpring,
  };
}

/**
 * Static helper for server components or static contexts
 * Returns reduced motion safe defaults
 */
export const reducedMotionSafe = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export default useReducedMotion;
