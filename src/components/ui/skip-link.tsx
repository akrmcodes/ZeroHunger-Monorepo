"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Skip Link Component
 * 
 * Provides keyboard-only users with a way to skip past navigation
 * and jump directly to main content. This is a WCAG 2.1 Level A requirement.
 * 
 * Usage:
 * 1. Add <SkipLink /> at the top of your layout
 * 2. Add id="main-content" to your main content area
 * 3. Optionally add tabIndex={-1} to main content for better focus management
 * 
 * @example
 * ```tsx
 * <body>
 *   <SkipLink />
 *   <Navigation />
 *   <main id="main-content" tabIndex={-1}>
 *     Content here
 *   </main>
 * </body>
 * ```
 */

interface SkipLinkProps {
    /** Target element ID to skip to (default: "main-content") */
    targetId?: string;
    /** Custom label text */
    label?: string;
    /** Additional CSS classes */
    className?: string;
}

export function SkipLink({
    targetId = "main-content",
    label = "Skip to main content",
    className
}: SkipLinkProps) {
    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        const target = document.getElementById(targetId);
        if (target) {
            // Set tabindex if not already focusable
            if (!target.hasAttribute("tabindex")) {
                target.setAttribute("tabindex", "-1");
            }

            // Focus the target
            target.focus({ preventScroll: false });

            // Scroll to target with smooth behavior
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [targetId]);

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className={cn(
                // Visually hidden by default
                "fixed top-0 left-0 z-9999",
                "sr-only focus:not-sr-only",
                // Visible styles when focused
                "focus:block focus:p-4",
                "focus:bg-primary focus:text-primary-foreground",
                "focus:font-semibold focus:text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "focus:rounded-br-lg",
                // Animation
                "transition-all duration-200",
                className
            )}
        >
            {label}
        </a>
    );
}

/**
 * Skip Link Group
 * 
 * Provides multiple skip links for complex layouts with multiple sections.
 * 
 * @example
 * ```tsx
 * <SkipLinkGroup 
 *   links={[
 *     { targetId: "main-content", label: "Skip to main content" },
 *     { targetId: "navigation", label: "Skip to navigation" },
 *     { targetId: "search", label: "Skip to search" },
 *   ]} 
 * />
 * ```
 */

interface SkipLinkItem {
    targetId: string;
    label: string;
}

interface SkipLinkGroupProps {
    links: SkipLinkItem[];
    className?: string;
}

export function SkipLinkGroup({ links, className }: SkipLinkGroupProps) {
    return (
        <div
            className={cn(
                "fixed top-0 left-0 z-9999",
                "flex flex-col gap-1",
                className
            )}
            role="navigation"
            aria-label="Skip links"
        >
            {links.map((link, index) => (
                <SkipLink
                    key={link.targetId}
                    targetId={link.targetId}
                    label={link.label}
                    className={index > 0 ? "focus:rounded-tl-none focus:rounded-br-none focus:rounded-bl-lg" : undefined}
                />
            ))}
        </div>
    );
}
