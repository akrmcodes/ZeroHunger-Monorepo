"use client";

import React, { useMemo, Children, isValidElement } from "react";
import { motion, Variants, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ============================================================================
// STAGGER CONTAINER - The Orchestrator
// ============================================================================

/**
 * ZeroHunger Physics Constants - Consistent with motion-system.tsx
 */
const PHYSICS = {
    default: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
    },
};

/**
 * Container variants for staggered animations
 */
const createContainerVariants = (
    staggerDelay: number,
    delayChildren: number,
    staggerDirection: 1 | -1
): Variants => ({
    hidden: {
        opacity: 1, // Container stays visible, children animate
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            delayChildren,
            staggerDirection,
        },
    },
    exit: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay * 0.5, // Faster exit
            staggerDirection: -staggerDirection, // Reverse direction on exit
        },
    },
});

/**
 * Child item animation variants
 */
export type StaggerEffect = "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "blur";

const createItemVariants = (effect: StaggerEffect, distance: number): Variants => {
    const effects: Record<StaggerEffect, Variants> = {
        fade: {
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
            exit: { opacity: 0 },
        },
        "slide-up": {
            hidden: { opacity: 0, y: distance },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -distance / 2 },
        },
        "slide-down": {
            hidden: { opacity: 0, y: -distance },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: distance / 2 },
        },
        "slide-left": {
            hidden: { opacity: 0, x: distance },
            visible: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -distance / 2 },
        },
        "slide-right": {
            hidden: { opacity: 0, x: -distance },
            visible: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: distance / 2 },
        },
        scale: {
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
        },
        blur: {
            hidden: { opacity: 0, filter: "blur(10px)" },
            visible: { opacity: 1, filter: "blur(0px)" },
            exit: { opacity: 0, filter: "blur(5px)" },
        },
    };

    return effects[effect] || effects.fade;
};

// ============================================================================
// STAGGER CONTAINER COMPONENT
// ============================================================================

interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "variants"> {
    children: React.ReactNode;
    className?: string;
    /** Stagger effect type */
    effect?: StaggerEffect;
    /** Delay between each child animation (in seconds) */
    staggerDelay?: number;
    /** Delay before starting the stagger sequence */
    initialDelay?: number;
    /** Distance for slide effects (in pixels) */
    distance?: number;
    /** Direction of stagger: 1 = forward, -1 = reverse */
    staggerDirection?: 1 | -1;
    /** Whether to animate on mount */
    animate?: boolean;
    /** Disable stagger wrapper on each child */
    unwrap?: boolean;
    /** Custom transition for items */
    itemTransition?: object;
}

/**
 * StaggerContainer - The Orchestrator for Cascading Animations
 * 
 * Automatically wraps children and animates them in sequence,
 * creating a beautiful waterfall effect.
 * 
 * Performance optimized:
 * - Uses CSS will-change only during animation
 * - Minimal re-renders with memoized variants
 * - Supports large lists efficiently
 * 
 * @example
 * // Basic usage
 * <StaggerContainer effect="slide-up" staggerDelay={0.1}>
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </StaggerContainer>
 * 
 * @example
 * // With custom settings
 * <StaggerContainer
 *   effect="scale"
 *   staggerDelay={0.08}
 *   initialDelay={0.2}
 *   distance={30}
 *   className="grid grid-cols-3 gap-4"
 * >
 *   {donations.map(d => <DonationCard key={d.id} donation={d} />)}
 * </StaggerContainer>
 */
export function StaggerContainer({
    children,
    className,
    effect = "slide-up",
    staggerDelay = 0.1,
    initialDelay = 0,
    distance = 24,
    staggerDirection = 1,
    animate = true,
    unwrap = false,
    itemTransition,
    ...props
}: StaggerContainerProps) {
    const { shouldReduceMotion } = useReducedMotion();

    // Memoize variants for performance
    const containerVariants = useMemo(
        () =>
            createContainerVariants(
                shouldReduceMotion ? 0 : staggerDelay,
                shouldReduceMotion ? 0 : initialDelay,
                staggerDirection
            ),
        [staggerDelay, initialDelay, staggerDirection, shouldReduceMotion]
    );

    const itemVariants = useMemo(
        () => createItemVariants(shouldReduceMotion ? "fade" : effect, shouldReduceMotion ? 0 : distance),
        [effect, distance, shouldReduceMotion]
    );

    const transition = useMemo(
        () => ({
            ...PHYSICS.default,
            ...itemTransition,
        }),
        [itemTransition]
    );

    // Process children
    const childArray = Children.toArray(children).filter(isValidElement);

    // If unwrap is true, just apply container without wrapping children
    if (unwrap) {
        return (
            <motion.div
                variants={containerVariants}
                initial={animate ? "hidden" : "visible"}
                animate="visible"
                exit="exit"
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial={animate ? "hidden" : "visible"}
            animate="visible"
            exit="exit"
            className={className}
            {...props}
        >
            {childArray.map((child, index) => (
                <motion.div
                    key={isValidElement(child) ? child.key || index : index}
                    variants={itemVariants}
                    transition={transition}
                    style={{
                        willChange: animate ? "opacity, transform" : "auto",
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

// ============================================================================
// STAGGER ITEM - For manual control
// ============================================================================

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
    children: React.ReactNode;
    className?: string;
    /** Effect type (should match parent StaggerContainer) */
    effect?: StaggerEffect;
    /** Distance for slide effects */
    distance?: number;
    /** Enable layout animations */
    layout?: boolean | "position" | "size";
    /** Shared layout ID */
    layoutId?: string;
}

/**
 * StaggerItem - Manual stagger child
 * 
 * Use this inside a StaggerContainer with unwrap={true}
 * for more control over individual items.
 * 
 * @example
 * <StaggerContainer unwrap>
 *   <StaggerItem effect="slide-up">Item 1</StaggerItem>
 *   <StaggerItem effect="slide-up">Item 2</StaggerItem>
 * </StaggerContainer>
 */
export function StaggerItem({
    children,
    className,
    effect = "slide-up",
    distance = 24,
    layout,
    layoutId,
    ...props
}: StaggerItemProps) {
    const { shouldReduceMotion } = useReducedMotion();

    const variants = useMemo(
        () => createItemVariants(shouldReduceMotion ? "fade" : effect, shouldReduceMotion ? 0 : distance),
        [effect, distance, shouldReduceMotion]
    );

    return (
        <motion.div
            variants={variants}
            transition={PHYSICS.default}
            className={className}
            layout={layout}
            layoutId={layoutId}
            {...props}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// GRID STAGGER - Optimized for grid layouts
// ============================================================================

interface GridStaggerProps extends StaggerContainerProps {
    /** Number of columns (used to calculate optimal stagger) */
    columns?: number;
    /** Gap between items (Tailwind class) */
    gap?: 2 | 3 | 4 | 5 | 6 | 8;
}

/**
 * GridStagger - Optimized stagger for grid layouts
 * 
 * Automatically adjusts stagger timing based on column count
 * for a more natural waterfall effect across rows.
 * 
 * @example
 * <GridStagger columns={3} gap={4}>
 *   {donations.map(d => <DonationCard key={d.id} donation={d} />)}
 * </GridStagger>
 */
export function GridStagger({
    columns = 3,
    gap = 4,
    className,
    staggerDelay = 0.08,
    ...props
}: GridStaggerProps) {
    // Adjust stagger based on columns for better visual flow
    const adjustedDelay = staggerDelay / Math.sqrt(columns);

    const gapClasses: Record<number, string> = {
        2: "gap-2",
        3: "gap-3",
        4: "gap-4",
        5: "gap-5",
        6: "gap-6",
        8: "gap-8",
    };

    return (
        <StaggerContainer
            className={cn(
                "grid",
                {
                    "grid-cols-1": columns === 1,
                    "grid-cols-2": columns === 2,
                    "grid-cols-3": columns === 3,
                    "grid-cols-4": columns === 4,
                },
                gapClasses[gap],
                className
            )}
            staggerDelay={adjustedDelay}
            {...props}
        />
    );
}

// ============================================================================
// LIST STAGGER - Optimized for list layouts
// ============================================================================

interface ListStaggerProps extends StaggerContainerProps {
    /** Render as ordered list */
    ordered?: boolean;
}

/**
 * ListStagger - Stagger for semantic lists
 * 
 * @example
 * <ListStagger ordered>
 *   <li>First item</li>
 *   <li>Second item</li>
 * </ListStagger>
 */
export function ListStagger({ ordered = false, className, ...props }: ListStaggerProps) {
    // Note: For semantic lists, wrap the StaggerContainer in a ul/ol
    // The stagger container uses divs for animation, children should be li elements styled appropriately
    return (
        <StaggerContainer
            className={cn(ordered ? "list-decimal" : "list-none", className)}
            {...props}
        />
    );
}

export default StaggerContainer;
