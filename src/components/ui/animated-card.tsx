"use client";

import React, { forwardRef, useCallback, useState } from "react";
import { motion, MotionProps, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ============================================================================
// ANIMATED CARD - Shared Layout Magic
// ============================================================================

/**
 * Physics constants for card interactions
 */
const CARD_PHYSICS = {
    hover: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
    },
    layout: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        mass: 1,
    },
};

// ============================================================================
// BASE ANIMATED CARD
// ============================================================================

interface AnimatedCardProps extends Omit<MotionProps, "style"> {
    children: React.ReactNode;
    className?: string;
    /** Unique ID for shared layout animations (morphing between views) */
    layoutId?: string;
    /** Enable layout animations for position/size changes */
    layout?: boolean | "position" | "size" | "preserve-aspect";
    /** Hover lift distance in pixels */
    hoverLift?: number;
    /** Hover scale factor */
    hoverScale?: number;
    /** Enable 3D tilt effect on hover */
    enableTilt?: boolean;
    /** Tilt intensity (degrees) */
    tiltDegrees?: number;
    /** Disable all hover effects */
    disableHover?: boolean;
    /** Enable glow effect on hover */
    enableGlow?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Custom style */
    style?: React.CSSProperties;
}

/**
 * AnimatedCard - Premium Interactive Card Component
 * 
 * Features:
 * 1. layoutId: Enables shared element transitions between views
 * 2. layout: Automatic animation when position/size changes
 * 3. Hover effects: Lift, scale, and optional 3D tilt
 * 4. Glow: Cursor-following glow effect
 * 5. Full accessibility support
 * 
 * @example
 * // Basic card with layoutId for morphing
 * <AnimatedCard layoutId={`donation-${id}`}>
 *   <CardContent />
 * </AnimatedCard>
 * 
 * @example
 * // Card with 3D tilt effect
 * <AnimatedCard enableTilt tiltDegrees={10}>
 *   <CardContent />
 * </AnimatedCard>
 * 
 * @example
 * // List with layout animations (cards auto-animate on reorder)
 * {items.map(item => (
 *   <AnimatedCard key={item.id} layout layoutId={`item-${item.id}`}>
 *     {item.name}
 *   </AnimatedCard>
 * ))}
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
    (
        {
            children,
            className,
            layoutId,
            layout = false,
            hoverLift = 8,
            hoverScale = 1.02,
            enableTilt = false,
            tiltDegrees = 5,
            disableHover = false,
            enableGlow = false,
            onClick,
            style,
            ...props
        },
        ref
    ) => {
        const { shouldReduceMotion } = useReducedMotion();
        const [isHovered, setIsHovered] = useState(false);

        // Motion values for 3D tilt effect
        const rotateX = useMotionValue(0);
        const rotateY = useMotionValue(0);

        // Motion values for glow effect
        const glowX = useMotionValue(50);
        const glowY = useMotionValue(50);

        // Spring animations for smooth tilt
        const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
        const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

        // Transform glow position to gradient
        const glowBackground = useTransform(
            [glowX, glowY],
            ([x, y]) =>
                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.08) 0%, transparent 50%)`
        );

        // Handle mouse move for tilt and glow
        const handleMouseMove = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (shouldReduceMotion || (!enableTilt && !enableGlow)) return;

                const element = e.currentTarget;
                const rect = element.getBoundingClientRect();

                // Calculate relative position (0-1)
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                // Update glow position
                if (enableGlow) {
                    glowX.set(x * 100);
                    glowY.set(y * 100);
                }

                // Update tilt rotation
                if (enableTilt) {
                    // Map 0-1 to -degrees to +degrees
                    const tiltX = (y - 0.5) * -tiltDegrees * 2;
                    const tiltY = (x - 0.5) * tiltDegrees * 2;
                    rotateX.set(tiltX);
                    rotateY.set(tiltY);
                }
            },
            [shouldReduceMotion, enableTilt, enableGlow, tiltDegrees, rotateX, rotateY, glowX, glowY]
        );

        const handleMouseEnter = useCallback(() => {
            setIsHovered(true);
        }, []);

        const handleMouseLeave = useCallback(() => {
            setIsHovered(false);
            rotateX.set(0);
            rotateY.set(0);
            glowX.set(50);
            glowY.set(50);
        }, [rotateX, rotateY, glowX, glowY]);

        // Calculate hover transform values
        const effectiveLift = shouldReduceMotion || disableHover ? 0 : hoverLift;
        const effectiveScale = shouldReduceMotion || disableHover ? 1 : hoverScale;

        return (
            <motion.div
                ref={ref}
                layoutId={layoutId}
                layout={layout}
                className={cn(
                    "relative overflow-hidden rounded-xl transition-shadow",
                    !disableHover && "cursor-pointer",
                    isHovered && !shouldReduceMotion && "shadow-xl",
                    className
                )}
                style={{
                    ...style,
                    perspective: enableTilt ? 1000 : undefined,
                    transformStyle: enableTilt ? "preserve-3d" : undefined,
                    rotateX: enableTilt && !shouldReduceMotion ? springRotateX : undefined,
                    rotateY: enableTilt && !shouldReduceMotion ? springRotateY : undefined,
                }}
                whileHover={
                    disableHover || shouldReduceMotion
                        ? undefined
                        : { y: -effectiveLift, scale: effectiveScale }
                }
                whileTap={disableHover || shouldReduceMotion ? undefined : { scale: 0.98 }}
                transition={CARD_PHYSICS.hover}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={onClick}
                {...props}
            >
                {/* Glow overlay */}
                {enableGlow && isHovered && !shouldReduceMotion && (
                    <motion.div
                        className="pointer-events-none absolute inset-0 z-10"
                        style={{ background: glowBackground }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}

                {children}
            </motion.div>
        );
    }
);
AnimatedCard.displayName = "AnimatedCard";

// ============================================================================
// EXPANDABLE CARD - For detail view transitions
// ============================================================================

interface ExpandableCardProps extends AnimatedCardProps {
    /** Whether the card is expanded (detail view) */
    isExpanded?: boolean;
    /** Collapsed content */
    collapsedContent: React.ReactNode;
    /** Expanded content */
    expandedContent: React.ReactNode;
    /** Handler when expansion state should change */
    onExpandChange?: (expanded: boolean) => void;
}

/**
 * ExpandableCard - Card that morphs between collapsed and expanded states
 * 
 * Uses layoutId to create smooth transitions between states.
 * Perfect for list → detail view patterns.
 * 
 * @example
 * function DonationList() {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 * 
 *   return (
 *     <>
 *       {donations.map(d => (
 *         <ExpandableCard
 *           key={d.id}
 *           layoutId={`donation-${d.id}`}
 *           isExpanded={selectedId === d.id}
 *           onExpandChange={() => setSelectedId(d.id)}
 *           collapsedContent={<DonationCardContent donation={d} />}
 *           expandedContent={<DonationDetailContent donation={d} />}
 *         />
 *       ))}
 *     </>
 *   );
 * }
 */
export const ExpandableCard = forwardRef<HTMLDivElement, ExpandableCardProps>(
    (
        {
            isExpanded = false,
            collapsedContent,
            expandedContent,
            onExpandChange,
            className,
            layoutId,
            ...props
        },
        ref
    ) => {
        const { shouldReduceMotion } = useReducedMotion();

        const handleClick = useCallback(() => {
            onExpandChange?.(!isExpanded);
        }, [isExpanded, onExpandChange]);

        return (
            <AnimatedCard
                ref={ref}
                layoutId={layoutId}
                layout
                className={cn(
                    isExpanded && "fixed inset-4 z-50 overflow-auto",
                    className
                )}
                onClick={handleClick}
                {...props}
            >
                <motion.div
                    layout
                    transition={shouldReduceMotion ? { duration: 0.1 } : CARD_PHYSICS.layout}
                >
                    {isExpanded ? expandedContent : collapsedContent}
                </motion.div>
            </AnimatedCard>
        );
    }
);
ExpandableCard.displayName = "ExpandableCard";

// ============================================================================
// FLIP CARD - 3D flip animation
// ============================================================================

interface FlipCardProps {
    /** Front face content */
    front: React.ReactNode;
    /** Back face content */
    back: React.ReactNode;
    /** Whether to show back face */
    isFlipped?: boolean;
    /** Flip duration in seconds */
    duration?: number;
    className?: string;
}

/**
 * FlipCard - 3D flip animation between two faces
 * 
 * @example
 * <FlipCard
 *   isFlipped={showDetails}
 *   front={<CardPreview />}
 *   back={<CardDetails />}
 * />
 */
export function FlipCard({
    front,
    back,
    isFlipped = false,
    duration = 0.6,
    className,
}: FlipCardProps) {
    const { shouldReduceMotion } = useReducedMotion();

    if (shouldReduceMotion) {
        return (
            <div className={className}>
                {isFlipped ? back : front}
            </div>
        );
    }

    return (
        <div
            className={cn("relative", className)}
            style={{ perspective: 1000 }}
        >
            <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full h-full"
            >
                {/* Front face */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    {front}
                </div>

                {/* Back face */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {back}
                </div>
            </motion.div>
        </div>
    );
}

// ============================================================================
// CARD SKELETON - Loading state
// ============================================================================

interface CardSkeletonProps {
    className?: string;
    /** Number of skeleton lines */
    lines?: number;
}

/**
 * CardSkeleton - Animated loading placeholder
 */
export function CardSkeleton({ className, lines = 3 }: CardSkeletonProps) {
    return (
        <motion.div
            className={cn(
                "rounded-xl border border-border/60 bg-card p-4 shadow-sm",
                className
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
            </div>

            {/* Content lines */}
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className="h-3 animate-pulse rounded bg-muted"
                        style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 100}ms` }}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
        </motion.div>
    );
}

export default AnimatedCard;
