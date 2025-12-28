"use client";

import React, { useRef, useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ============================================================================
// TOUCH DEVICE DETECTION
// ============================================================================

/**
 * Check if the device has touch capabilities
 * Magnetic effects are disabled on touch devices for better UX
 * Uses useSyncExternalStore for safe SSR and hydration
 */
function useIsTouchDevice() {
    const subscribe = useCallback((callback: () => void) => {
        // Listen for media query changes
        const mediaQuery = window.matchMedia("(pointer: coarse)");
        mediaQuery.addEventListener("change", callback);
        return () => mediaQuery.removeEventListener("change", callback);
    }, []);

    const getSnapshot = useCallback(() => {
        if (typeof window === "undefined") return false;

        const hasTouchPoints =
            "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;
        const hasTouchEvent = "ontouchstart" in window;
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

        return hasTouchPoints || hasTouchEvent || hasCoarsePointer;
    }, []);

    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================================================
// MAGNETIC BUTTON - The "Wow" Factor
// ============================================================================

/**
 * MagneticButton - A physics-based interactive button
 * 
 * Features:
 * 1. Magnetic pull: Button moves toward cursor when nearby
 * 2. Ripple glow: Light follows mouse position inside button
 * 3. Spring physics: Smooth, organic return to rest position
 * 4. Full accessibility: Reduced motion support
 * 
 * @example
 * <MagneticButton variant="default" size="lg">
 *   Get Started
 * </MagneticButton>
 */

// Spring configuration for magnetic movement
const SPRING_CONFIG = {
    stiffness: 150,
    damping: 15,
    mass: 0.1,
};

// Maximum distance for magnetic effect (in pixels)
const MAGNETIC_RADIUS = 150;
const MAGNETIC_STRENGTH = 0.35; // How strongly the button is pulled (0-1)

// Button variants using CVA
// All sizes meet WCAG 2.1 minimum touch target of 44x44px
const magneticButtonVariants = cva(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg",
                outline:
                    "border-2 border-primary bg-transparent text-primary hover:bg-primary/5",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25",
                glow: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40",
            },
            size: {
                // All sizes ensure minimum 44px height for touch accessibility
                sm: "h-11 min-w-[44px] px-4 text-xs",
                default: "h-11 min-w-[44px] px-6",
                lg: "h-13 min-w-[52px] px-8 text-base",
                xl: "h-14 min-w-[56px] px-10 text-lg",
                icon: "h-11 w-11 min-w-[44px] min-h-[44px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface MagneticButtonProps
    extends VariantProps<typeof magneticButtonVariants> {
    /** Use as child component (Radix Slot pattern) */
    asChild?: boolean;
    /** Disable magnetic effect */
    disableMagnetic?: boolean;
    /** Disable glow effect */
    disableGlow?: boolean;
    /** Custom magnetic strength (0-1) */
    magneticStrength?: number;
    /** Children elements */
    children?: React.ReactNode;
    /** Additional class names */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Type of button */
    type?: "button" | "submit" | "reset";
}

const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            disableMagnetic = false,
            disableGlow = false,
            magneticStrength = MAGNETIC_STRENGTH,
            children,
            ...props
        },
        ref
    ) => {
        const { shouldReduceMotion } = useReducedMotion();
        const isTouchDevice = useIsTouchDevice();
        const buttonRef = useRef<HTMLButtonElement>(null);

        // Disable magnetic effect on touch devices
        const effectiveDisableMagnetic = disableMagnetic || isTouchDevice;

        // Combine refs
        const combinedRef = useCallback(
            (node: HTMLButtonElement | null) => {
                buttonRef.current = node;
                if (typeof ref === "function") {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },
            [ref]
        );

        // Motion values for magnetic effect
        const x = useMotionValue(0);
        const y = useMotionValue(0);

        // Spring animation for smooth return
        const springX = useSpring(x, SPRING_CONFIG);
        const springY = useSpring(y, SPRING_CONFIG);

        // Motion values for glow effect
        const glowX = useMotionValue(50);
        const glowY = useMotionValue(50);

        // State for hover
        const [isHovered, setIsHovered] = useState(false);

        // Transform glow position to percentage
        const glowBackground = useTransform(
            [glowX, glowY],
            ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
        );

        // Handle mouse move for magnetic effect
        const handleMouseMove = useCallback(
            (e: MouseEvent) => {
                if (!buttonRef.current || effectiveDisableMagnetic || shouldReduceMotion) return;

                const button = buttonRef.current;
                const rect = button.getBoundingClientRect();

                // Button center
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Distance from cursor to button center
                const distanceX = e.clientX - centerX;
                const distanceY = e.clientY - centerY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Check if cursor is within magnetic radius
                if (distance < MAGNETIC_RADIUS) {
                    // Calculate pull strength (stronger when closer)
                    const pull = (1 - distance / MAGNETIC_RADIUS) * magneticStrength;

                    x.set(distanceX * pull);
                    y.set(distanceY * pull);
                } else {
                    // Reset when outside radius
                    x.set(0);
                    y.set(0);
                }
            },
            [effectiveDisableMagnetic, shouldReduceMotion, magneticStrength, x, y]
        );

        // Handle mouse enter on button for glow effect
        const handleButtonMouseMove = useCallback(
            (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!buttonRef.current || disableGlow || shouldReduceMotion) return;

                const rect = buttonRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                glowX.set(x);
                glowY.set(y);
            },
            [disableGlow, shouldReduceMotion, glowX, glowY]
        );

        const handleMouseEnter = useCallback(() => {
            setIsHovered(true);
        }, []);

        const handleMouseLeave = useCallback(() => {
            setIsHovered(false);
            x.set(0);
            y.set(0);
            glowX.set(50);
            glowY.set(50);
        }, [x, y, glowX, glowY]);

        // Add global mouse move listener for magnetic effect
        useEffect(() => {
            if (effectiveDisableMagnetic || shouldReduceMotion) return;

            window.addEventListener("mousemove", handleMouseMove);
            return () => window.removeEventListener("mousemove", handleMouseMove);
        }, [handleMouseMove, effectiveDisableMagnetic, shouldReduceMotion]);

        const Comp = asChild ? Slot : "button";

        // If reduced motion, render without effects
        if (shouldReduceMotion) {
            return (
                <Comp
                    ref={combinedRef}
                    className={cn(magneticButtonVariants({ variant, size, className }))}
                    disabled={props.disabled}
                    onClick={props.onClick}
                    type={props.type}
                >
                    {children}
                </Comp>
            );
        }

        return (
            <motion.div
                style={{
                    x: springX,
                    y: springY,
                    display: "inline-block",
                }}
            >
                <motion.button
                    ref={combinedRef}
                    className={cn(magneticButtonVariants({ variant, size, className }))}
                    onMouseMove={handleButtonMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_CONFIG}
                    disabled={props.disabled}
                    onClick={props.onClick}
                    type={props.type}
                >
                    {/* Glow overlay */}
                    {!disableGlow && isHovered && (
                        <motion.div
                            className="pointer-events-none absolute inset-0"
                            style={{ background: glowBackground }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}

                    {/* Ripple effect on click */}
                    <span className="relative z-10 flex items-center gap-2">
                        {children}
                    </span>
                </motion.button>
            </motion.div>
        );
    }
);
MagneticButton.displayName = "MagneticButton";

// ============================================================================
// MAGNETIC WRAPPER - For any element
// ============================================================================

interface MagneticWrapperProps {
    children: React.ReactNode;
    className?: string;
    /** Custom magnetic strength (0-1) */
    strength?: number;
    /** Magnetic radius in pixels */
    radius?: number;
}

/**
 * MagneticWrapper - Apply magnetic effect to any element
 * 
 * @example
 * <MagneticWrapper>
 *   <div className="card">Any content</div>
 * </MagneticWrapper>
 */
export function MagneticWrapper({
    children,
    className,
    strength = 0.2,
    radius = 100,
}: MagneticWrapperProps) {
    const { shouldReduceMotion } = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, SPRING_CONFIG);
    const springY = useSpring(y, SPRING_CONFIG);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!ref.current || shouldReduceMotion) return;

            const element = ref.current;
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < radius) {
                const pull = (1 - distance / radius) * strength;
                x.set(distanceX * pull);
                y.set(distanceY * pull);
            } else {
                x.set(0);
                y.set(0);
            }
        },
        [shouldReduceMotion, strength, radius, x, y]
    );

    const handleMouseLeave = useCallback(() => {
        x.set(0);
        y.set(0);
    }, [x, y]);

    useEffect(() => {
        if (shouldReduceMotion) return;

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [handleMouseMove, shouldReduceMotion]);

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            style={{ x: springX, y: springY }}
            className={className}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </motion.div>
    );
}

export { MagneticButton, magneticButtonVariants };
export default MagneticButton;
