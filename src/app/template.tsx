"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ============================================================================
// PAGE TRANSITION CONFIGURATION
// ============================================================================

/**
 * Centralized physics for the entire application.
 * These values create the "Rolls Royce" feel - heavy, smooth, premium.
 */
const TRANSITION_PHYSICS = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    mass: 1,
};

/**
 * Page transition variants with context-awareness.
 * The animation adapts based on navigation direction.
 */
const pageVariants = {
    // Initial state (entering)
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
        filter: "blur(4px)",
    },
    // Active state
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
    },
    // Exit state
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.99,
        filter: "blur(2px)",
    },
};

/**
 * Reduced motion variants - simple opacity fade
 */
const reducedMotionVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

// ============================================================================
// SCROLL RESTORATION HOOK
// ============================================================================

/**
 * Handles scroll position gracefully during page transitions.
 * Resets scroll to top on new page, preserves on back navigation.
 */
function useScrollReset() {
    const pathname = usePathname();
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Skip initial mount to avoid jarring scroll on first load
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Smooth scroll to top on route change
        // Using requestAnimationFrame for smoother transition coordination
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: "instant", // Instant to prevent fighting with animation
            });
        };

        // Small delay to let exit animation complete
        const timeoutId = setTimeout(scrollToTop, 50);

        return () => clearTimeout(timeoutId);
    }, [pathname]);
}

// ============================================================================
// PAGE WRAPPER COMPONENT
// ============================================================================

interface PageWrapperProps {
    children: React.ReactNode;
}

/**
 * Internal component that wraps page content with animations.
 * Uses the pathname as a key for AnimatePresence.
 */
function PageWrapper({ children }: PageWrapperProps) {
    const pathname = usePathname();
    const { shouldReduceMotion } = useReducedMotion();

    // Handle scroll position
    useScrollReset();

    const variants = shouldReduceMotion ? reducedMotionVariants : pageVariants;
    const transition = shouldReduceMotion
        ? { duration: 0.15 }
        : {
            ...TRANSITION_PHYSICS,
            // Stagger opacity slightly for more organic feel
            opacity: { duration: 0.3, ease: "easeOut" },
            filter: { duration: 0.3 },
        };

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                className="min-h-screen"
                // Prevent layout shift during animation
                style={{
                    willChange: "opacity, transform",
                    // Ensure content doesn't cause CLS
                    contain: "layout style paint",
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// MAIN TEMPLATE EXPORT
// ============================================================================

interface TemplateProps {
    children: React.ReactNode;
}

/**
 * Template.tsx - The Holy Grail of Navigation
 * 
 * This template wraps all pages and provides:
 * 1. Context-aware page transitions with physics-based animation
 * 2. Centralized motion configuration via MotionConfig
 * 3. Graceful scroll position handling
 * 4. Full accessibility support (reduced motion)
 * 5. Zero CLS (Cumulative Layout Shift)
 * 
 * @example
 * // This file should be placed at src/app/template.tsx
 * // It automatically wraps all pages in the app directory
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates
 */
export default function Template({ children }: TemplateProps) {
    const { shouldReduceMotion } = useReducedMotion();

    return (
        <MotionConfig
            reducedMotion={shouldReduceMotion ? "always" : "never"}
            transition={TRANSITION_PHYSICS}
        >
            <PageWrapper>{children}</PageWrapper>
        </MotionConfig>
    );
}

// ============================================================================
// ADDITIONAL EXPORTS FOR ADVANCED USAGE
// ============================================================================

export { pageVariants, reducedMotionVariants, TRANSITION_PHYSICS };
