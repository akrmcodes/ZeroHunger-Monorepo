"use client";

import React, { createContext, useContext, forwardRef, useMemo } from "react";
import {
    motion,
    MotionConfig,
    MotionProps,
    Variants,
    AnimatePresence,
    useReducedMotion as framerUseReducedMotion,
    LayoutGroup,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// PHYSICS ENGINE - The Heart of Liquid Engineering
// ============================================================================

/**
 * ZeroHunger Physics Constants
 * These values create the "expensive", "heavy", "Rolls Royce" feel.
 * 
 * - stiffness: 100 → Controls how snappy the spring is (lower = more fluid)
 * - damping: 20 → Controls oscillation (higher = less bounce)
 * - mass: 1 → Weight of the element
 */
export const PHYSICS = {
    // Primary spring - used for most interactions
    default: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        mass: 1,
    },
    // Snappy spring - for micro-interactions
    snappy: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        mass: 0.5,
    },
    // Gentle spring - for large movements
    gentle: {
        type: "spring" as const,
        stiffness: 60,
        damping: 20,
        mass: 1.2,
    },
    // Bouncy spring - for playful interactions
    bouncy: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        mass: 0.8,
    },
    // Silk - ultra-smooth for page transitions
    silk: {
        type: "spring" as const,
        stiffness: 50,
        damping: 25,
        mass: 1.5,
    },
} as const;

// Easing curves for non-spring animations
export const EASINGS = {
    // Smooth deceleration
    out: [0.16, 1, 0.3, 1] as const,
    // Smooth acceleration
    in: [0.7, 0, 0.84, 0] as const,
    // Smooth both ways
    inOut: [0.65, 0, 0.35, 1] as const,
    // Anticipation + overshoot
    anticipate: [0.68, -0.6, 0.32, 1.6] as const,
};

// Timing constants
export const DURATIONS = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
    glacial: 1.0,
};

// Stagger timing
export const STAGGER = {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
};

// ============================================================================
// MOTION CONTEXT - Centralized Configuration
// ============================================================================

interface MotionSystemContextValue {
    reducedMotion: boolean;
    physics: typeof PHYSICS;
    easings: typeof EASINGS;
    durations: typeof DURATIONS;
}

const MotionSystemContext = createContext<MotionSystemContextValue>({
    reducedMotion: false,
    physics: PHYSICS,
    easings: EASINGS,
    durations: DURATIONS,
});

export const useMotionSystem = () => useContext(MotionSystemContext);

// ============================================================================
// MOTION PROVIDER - The Central Nervous System
// ============================================================================

interface MotionProviderProps {
    children: React.ReactNode;
    /** Force reduced motion regardless of user preference */
    forceReducedMotion?: boolean;
}

export function MotionProvider({ children, forceReducedMotion = false }: MotionProviderProps) {
    const prefersReducedMotion = framerUseReducedMotion();
    const reducedMotion = forceReducedMotion || !!prefersReducedMotion;

    const value = useMemo(
        () => ({
            reducedMotion,
            physics: PHYSICS,
            easings: EASINGS,
            durations: DURATIONS,
        }),
        [reducedMotion]
    );

    // Reduced motion transition - simple fade
    const reducedTransition = { duration: 0.01 };

    return (
        <MotionSystemContext.Provider value={value}>
            <MotionConfig
                reducedMotion={reducedMotion ? "always" : "never"}
                transition={reducedMotion ? reducedTransition : PHYSICS.default}
            >
                <LayoutGroup>{children}</LayoutGroup>
            </MotionConfig>
        </MotionSystemContext.Provider>
    );
}

// ============================================================================
// ANIMATION PRIMITIVES - The Building Blocks
// ============================================================================

// Shared motion component props
interface BaseMotionProps extends Omit<MotionProps, "variants"> {
    children?: React.ReactNode;
    className?: string;
    /** Animation delay in seconds */
    delay?: number;
    /** Custom animation duration override */
    duration?: number;
    /** Whether to skip exit animation */
    skipExit?: boolean;
    /** Enable layout animations */
    layout?: boolean | "position" | "size" | "preserve-aspect";
    /** Shared layout ID for morphing between elements */
    layoutId?: string;
}

// ============================================================================
// FADE - Elegant Opacity Transition
// ============================================================================

interface FadeProps extends BaseMotionProps {
    /** Direction for fade with movement */
    direction?: "up" | "down" | "left" | "right" | "none";
    /** Movement distance in pixels */
    distance?: number;
}

const fadeVariants = (direction: string, distance: number): Variants => {
    const offset = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
        none: {},
    }[direction] || {};

    return {
        hidden: { opacity: 0, ...offset },
        visible: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, ...offset },
    };
};

export const Fade = forwardRef<HTMLDivElement, FadeProps>(
    (
        {
            children,
            className,
            delay = 0,
            duration,
            direction = "up",
            distance = 20,
            skipExit = false,
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();
        const variants = fadeVariants(reducedMotion ? "none" : direction, reducedMotion ? 0 : distance);

        return (
            <motion.div
                ref={ref}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit={skipExit ? undefined : "exit"}
                transition={{
                    ...PHYSICS.default,
                    delay: reducedMotion ? 0 : delay,
                    ...(duration && { duration }),
                }}
                className={className}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Fade.displayName = "Fade";

// ============================================================================
// SLIDE - Directional Movement with Physics
// ============================================================================

interface SlideProps extends BaseMotionProps {
    direction?: "up" | "down" | "left" | "right";
    distance?: number;
}

const slideVariants = (direction: string, distance: number): Variants => {
    const transforms = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
    };

    return {
        hidden: { opacity: 0, ...transforms[direction as keyof typeof transforms] },
        visible: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, ...transforms[direction as keyof typeof transforms] },
    };
};

export const Slide = forwardRef<HTMLDivElement, SlideProps>(
    (
        {
            children,
            className,
            delay = 0,
            duration,
            direction = "up",
            distance = 40,
            skipExit = false,
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();
        const variants = slideVariants(direction, reducedMotion ? 0 : distance);

        return (
            <motion.div
                ref={ref}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit={skipExit ? undefined : "exit"}
                transition={{
                    ...PHYSICS.gentle,
                    delay: reducedMotion ? 0 : delay,
                    ...(duration && { duration }),
                }}
                className={className}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Slide.displayName = "Slide";

// ============================================================================
// SCALE - Zoom In/Out with Grace
// ============================================================================

interface ScaleProps extends BaseMotionProps {
    /** Scale origin: 0 = invisible, 1 = full size */
    from?: number;
    /** Scale target (default: 1) */
    to?: number;
}

export const Scale = forwardRef<HTMLDivElement, ScaleProps>(
    (
        {
            children,
            className,
            delay = 0,
            duration,
            from = 0.9,
            to = 1,
            skipExit = false,
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();
        const scaleFrom = reducedMotion ? 1 : from;

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: scaleFrom }}
                animate={{ opacity: 1, scale: to }}
                exit={skipExit ? undefined : { opacity: 0, scale: scaleFrom }}
                transition={{
                    ...PHYSICS.snappy,
                    delay: reducedMotion ? 0 : delay,
                    ...(duration && { duration }),
                }}
                className={className}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Scale.displayName = "Scale";

// ============================================================================
// STAGGER - Cascading List Animation (The Waterfall)
// ============================================================================

interface StaggerProps extends Omit<BaseMotionProps, "delay"> {
    /** Time between each child animation */
    staggerDelay?: number;
    /** Direction of stagger: forward or reverse */
    staggerDirection?: "forward" | "reverse";
    /** Delay before the stagger sequence starts */
    startDelay?: number;
}

const staggerContainerVariants = (
    staggerDelay: number,
    staggerDirection: "forward" | "reverse",
    startDelay: number
): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            staggerDirection: staggerDirection === "reverse" ? -1 : 1,
            delayChildren: startDelay,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: staggerDelay * 0.5,
            staggerDirection: staggerDirection === "reverse" ? 1 : -1,
        },
    },
});

const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: PHYSICS.default,
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: 0.2 },
    },
};

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
    (
        {
            children,
            className,
            staggerDelay = STAGGER.normal,
            staggerDirection = "forward",
            startDelay = 0,
            skipExit = false,
            layout,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();
        const effectiveDelay = reducedMotion ? 0 : staggerDelay;
        const effectiveStartDelay = reducedMotion ? 0 : startDelay;
        const variants = staggerContainerVariants(effectiveDelay, staggerDirection, effectiveStartDelay);

        return (
            <motion.div
                ref={ref}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit={skipExit ? undefined : "exit"}
                className={className}
                layout={layout}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Stagger.displayName = "Stagger";

// Stagger Item - Use inside Stagger container
export const StaggerItem = forwardRef<
    HTMLDivElement,
    BaseMotionProps & { custom?: number }
>(({ children, className, layout, layoutId, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            variants={staggerItemVariants}
            className={className}
            layout={layout}
            layoutId={layoutId}
            {...props}
        >
            {children}
        </motion.div>
    );
});
StaggerItem.displayName = "StaggerItem";

// ============================================================================
// PRESENCE - Animate mount/unmount
// ============================================================================

interface PresenceProps {
    children: React.ReactNode;
    /** Animation mode */
    mode?: "sync" | "wait" | "popLayout";
    /** Initial animation on first mount */
    initial?: boolean;
}

export function Presence({ children, mode = "wait", initial = true }: PresenceProps) {
    return (
        <AnimatePresence mode={mode} initial={initial}>
            {children}
        </AnimatePresence>
    );
}

// ============================================================================
// HOVER LIFT - Interactive Card Effect
// ============================================================================

interface HoverLiftProps extends BaseMotionProps {
    /** Lift distance in pixels on hover */
    lift?: number;
    /** Scale factor on hover */
    scale?: number;
    /** Shadow intensity on hover */
    shadow?: "none" | "sm" | "md" | "lg" | "xl";
}

const shadowClasses = {
    none: "",
    sm: "hover:shadow-md",
    md: "hover:shadow-lg",
    lg: "hover:shadow-xl",
    xl: "hover:shadow-2xl",
};

export const HoverLift = forwardRef<HTMLDivElement, HoverLiftProps>(
    (
        {
            children,
            className,
            lift = 4,
            scale = 1.02,
            shadow = "md",
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();

        const effectiveLift = reducedMotion ? 0 : lift;
        const effectiveScale = reducedMotion ? 1 : scale;

        return (
            <motion.div
                ref={ref}
                whileHover={{ y: -effectiveLift, scale: effectiveScale }}
                whileTap={{ scale: reducedMotion ? 1 : 0.98 }}
                transition={PHYSICS.snappy}
                className={cn(shadowClasses[shadow], "transition-shadow", className)}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
HoverLift.displayName = "HoverLift";

// ============================================================================
// REVEAL - Scroll-triggered Animation
// ============================================================================

interface RevealProps extends BaseMotionProps {
    /** Threshold for triggering animation (0-1) */
    threshold?: number;
    /** Only animate once */
    once?: boolean;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(
    (
        {
            children,
            className,
            delay = 0,
            threshold = 0.2,
            once = true,
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once, amount: threshold }}
                transition={{
                    ...PHYSICS.gentle,
                    delay: reducedMotion ? 0 : delay,
                }}
                className={className}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Reveal.displayName = "Reveal";

// ============================================================================
// PULSE - Attention-grabbing animation
// ============================================================================

interface PulseProps extends BaseMotionProps {
    /** Pulse intensity */
    intensity?: number;
    /** Animation duration in seconds */
    pulseDuration?: number;
}

export const Pulse = forwardRef<HTMLDivElement, PulseProps>(
    (
        {
            children,
            className,
            intensity = 1.05,
            pulseDuration = 2,
            layout,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { reducedMotion } = useMotionSystem();

        if (reducedMotion) {
            return (
                <div ref={ref} className={className} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                    {children}
                </div>
            );
        }

        return (
            <motion.div
                ref={ref}
                animate={{
                    scale: [1, intensity, 1],
                }}
                transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className={className}
                layout={layout}
                layoutId={layoutId}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Pulse.displayName = "Pulse";

// ============================================================================
// SHIMMER - Loading state effect
// ============================================================================

interface ShimmerProps {
    className?: string;
    /** Width of the shimmer */
    width?: string;
    /** Height of the shimmer */
    height?: string;
    /** Border radius */
    rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
};

export function Shimmer({
    className,
    width = "100%",
    height = "1rem",
    rounded = "md",
}: ShimmerProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-muted",
                roundedClasses[rounded],
                className
            )}
            style={{ width, height }}
        >
            <motion.div
                className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["0%", "200%"] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    AnimatePresence,
    motion,
    LayoutGroup,
    type Variants,
    type MotionProps,
};

// Re-export the stagger item variants for external use
export { staggerItemVariants };
