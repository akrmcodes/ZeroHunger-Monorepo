"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Shimmer, PHYSICS } from "./motion-system";
import { Card, CardContent, CardHeader } from "./card";

// ============================================================================
// BREATHING EFFECT - Organic loading pulse
// ============================================================================

const breathingVariants = {
    initial: { opacity: 0.5 },
    animate: {
        opacity: [0.5, 0.8, 0.5],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    },
};

interface BreathingContainerProps {
    children: React.ReactNode;
    className?: string;
    /** Delay before breathing starts (in seconds) */
    delay?: number;
}

function BreathingContainer({
    children,
    className,
    delay = 0
}: BreathingContainerProps) {
    return (
        <motion.div
            className={className}
            variants={breathingVariants}
            initial="initial"
            animate="animate"
            transition={{ delay }}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// DONATION CARD SKELETON - Matches DonationCard layout
// ============================================================================

interface DonationCardSkeletonProps {
    className?: string;
    /** Index for staggered animation delay */
    index?: number;
}

export function DonationCardSkeleton({
    className,
    index = 0
}: DonationCardSkeletonProps) {
    const delay = index * 0.1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...PHYSICS.gentle, delay }}
        >
            <Card className={cn("overflow-hidden", className)}>
                {/* Image skeleton */}
                <div className="relative aspect-video">
                    <BreathingContainer className="h-full w-full">
                        <Shimmer height="100%" rounded="none" />
                    </BreathingContainer>
                    {/* Status badge skeleton */}
                    <div className="absolute top-2 left-2">
                        <Shimmer width="5rem" height="1.5rem" rounded="full" />
                    </div>
                    {/* Time badge skeleton */}
                    <div className="absolute bottom-2 right-2">
                        <Shimmer width="4rem" height="1.25rem" rounded="md" />
                    </div>
                </div>

                <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <BreathingContainer delay={delay + 0.1}>
                        <Shimmer height="1.5rem" width="80%" rounded="md" />
                    </BreathingContainer>

                    {/* Description lines */}
                    <div className="space-y-2">
                        <BreathingContainer delay={delay + 0.15}>
                            <Shimmer height="0.875rem" width="100%" rounded="sm" />
                        </BreathingContainer>
                        <BreathingContainer delay={delay + 0.2}>
                            <Shimmer height="0.875rem" width="70%" rounded="sm" />
                        </BreathingContainer>
                    </div>

                    {/* Location */}
                    <BreathingContainer delay={delay + 0.25}>
                        <div className="flex items-center gap-2">
                            <Shimmer width="1rem" height="1rem" rounded="full" />
                            <Shimmer height="0.875rem" width="60%" rounded="sm" />
                        </div>
                    </BreathingContainer>

                    {/* Footer with avatar and button */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <Shimmer width="2rem" height="2rem" rounded="full" />
                            <Shimmer height="0.875rem" width="5rem" rounded="sm" />
                        </div>
                        <Shimmer width="5rem" height="2.25rem" rounded="md" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// DONATION GRID SKELETON - Full grid of DonationCardSkeletons
// ============================================================================

interface DonationGridSkeletonProps {
    /** Number of skeleton cards to show */
    count?: number;
    className?: string;
}

export function DonationGridSkeleton({
    count = 6,
    className
}: DonationGridSkeletonProps) {
    return (
        <div className={cn(
            "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            className
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <DonationCardSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

// ============================================================================
// PROFILE SKELETON - Matches ProfileHeader + ProfileStatsCards layout
// ============================================================================

interface ProfileSkeletonProps {
    className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
    return (
        <motion.div
            className={cn("space-y-6", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={PHYSICS.gentle}
        >
            {/* Header section */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar */}
                        <BreathingContainer>
                            <Shimmer width="6rem" height="6rem" rounded="full" />
                        </BreathingContainer>

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <BreathingContainer delay={0.1}>
                                <Shimmer height="1.75rem" width="12rem" rounded="md" />
                            </BreathingContainer>
                            <BreathingContainer delay={0.15}>
                                <Shimmer height="1rem" width="8rem" rounded="sm" />
                            </BreathingContainer>
                            <BreathingContainer delay={0.2}>
                                <div className="flex gap-4">
                                    <Shimmer height="0.875rem" width="6rem" rounded="sm" />
                                    <Shimmer height="0.875rem" width="6rem" rounded="sm" />
                                </div>
                            </BreathingContainer>
                        </div>

                        {/* Edit button */}
                        <BreathingContainer delay={0.25}>
                            <Shimmer width="6rem" height="2.5rem" rounded="md" />
                        </BreathingContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatsCardSkeleton key={i} index={i} />
                ))}
            </div>

            {/* Impact score card */}
            <Card>
                <CardHeader>
                    <BreathingContainer delay={0.5}>
                        <Shimmer height="1.25rem" width="8rem" rounded="md" />
                    </BreathingContainer>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BreathingContainer delay={0.55}>
                        <Shimmer height="1rem" width="100%" rounded="sm" />
                    </BreathingContainer>
                    <BreathingContainer delay={0.6}>
                        <Shimmer height="3rem" width="100%" rounded="lg" />
                    </BreathingContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// STATS CARD SKELETON - Single stat card
// ============================================================================

interface StatsCardSkeletonProps {
    className?: string;
    index?: number;
}

export function StatsCardSkeleton({
    className,
    index = 0
}: StatsCardSkeletonProps) {
    const delay = 0.3 + index * 0.05;

    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-2">
                <BreathingContainer delay={delay}>
                    <Shimmer height="0.75rem" width="60%" rounded="sm" />
                </BreathingContainer>
                <BreathingContainer delay={delay + 0.05}>
                    <Shimmer height="2rem" width="4rem" rounded="md" />
                </BreathingContainer>
                <BreathingContainer delay={delay + 0.1}>
                    <Shimmer height="0.625rem" width="80%" rounded="sm" />
                </BreathingContainer>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// STATS GRID SKELETON - Grid of StatsCardSkeletons
// ============================================================================

interface StatsGridSkeletonProps {
    count?: number;
    className?: string;
}

export function StatsGridSkeleton({
    count = 4,
    className
}: StatsGridSkeletonProps) {
    return (
        <div className={cn(
            "grid gap-4 grid-cols-2 md:grid-cols-4",
            className
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <StatsCardSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

// ============================================================================
// CLAIMS LIST SKELETON - For claims page
// ============================================================================

interface ClaimsListSkeletonProps {
    count?: number;
    className?: string;
}

export function ClaimsListSkeleton({
    count = 5,
    className
}: ClaimsListSkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <ClaimCardSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

// ============================================================================
// CLAIM CARD SKELETON - Single claim item
// ============================================================================

interface ClaimCardSkeletonProps {
    className?: string;
    index?: number;
}

export function ClaimCardSkeleton({
    className,
    index = 0
}: ClaimCardSkeletonProps) {
    const delay = index * 0.08;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...PHYSICS.gentle, delay }}
        >
            <Card className={className}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        {/* Image */}
                        <BreathingContainer>
                            <Shimmer width="5rem" height="5rem" rounded="lg" />
                        </BreathingContainer>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <BreathingContainer delay={delay + 0.05}>
                                <Shimmer height="1.25rem" width="70%" rounded="md" />
                            </BreathingContainer>
                            <BreathingContainer delay={delay + 0.1}>
                                <Shimmer height="0.875rem" width="50%" rounded="sm" />
                            </BreathingContainer>
                            <BreathingContainer delay={delay + 0.15}>
                                <div className="flex gap-2">
                                    <Shimmer width="4rem" height="1.25rem" rounded="full" />
                                    <Shimmer width="5rem" height="1.25rem" rounded="full" />
                                </div>
                            </BreathingContainer>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <BreathingContainer delay={delay + 0.2}>
                                <Shimmer width="2.5rem" height="2.5rem" rounded="md" />
                            </BreathingContainer>
                            <BreathingContainer delay={delay + 0.25}>
                                <Shimmer width="2.5rem" height="2.5rem" rounded="md" />
                            </BreathingContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ============================================================================
// TABLE SKELETON - For data tables
// ============================================================================

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function TableSkeleton({
    rows = 5,
    columns = 4,
    className
}: TableSkeletonProps) {
    return (
        <div className={cn("w-full space-y-2", className)}>
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <BreathingContainer key={i} delay={i * 0.05} className="flex-1">
                        <Shimmer height="1rem" width="80%" rounded="sm" />
                    </BreathingContainer>
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <motion.div
                    key={rowIndex}
                    className="flex gap-4 py-3 border-b border-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIndex * 0.05 }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <BreathingContainer
                            key={colIndex}
                            delay={(rowIndex * columns + colIndex) * 0.02}
                            className="flex-1"
                        >
                            <Shimmer
                                height="0.875rem"
                                width={colIndex === 0 ? "90%" : "70%"}
                                rounded="sm"
                            />
                        </BreathingContainer>
                    ))}
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================================
// TEXT SKELETON - For text content
// ============================================================================

interface TextSkeletonProps {
    lines?: number;
    className?: string;
}

export function TextSkeleton({
    lines = 3,
    className
}: TextSkeletonProps) {
    const lineWidths = ["100%", "90%", "80%", "95%", "70%", "85%"];

    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <BreathingContainer key={i} delay={i * 0.05}>
                    <Shimmer
                        height="0.875rem"
                        width={lineWidths[i % lineWidths.length]}
                        rounded="sm"
                    />
                </BreathingContainer>
            ))}
        </div>
    );
}

// ============================================================================
// DASHBOARD PAGE SKELETON - Complete dashboard loading state
// ============================================================================

export function DashboardPageSkeleton() {
    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={PHYSICS.gentle}
        >
            {/* Page title */}
            <BreathingContainer>
                <Shimmer height="2rem" width="12rem" rounded="md" />
            </BreathingContainer>

            {/* Stats */}
            <StatsGridSkeleton count={4} />

            {/* Main content area */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column - 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <BreathingContainer delay={0.4}>
                                <Shimmer height="1.25rem" width="10rem" rounded="md" />
                            </BreathingContainer>
                        </CardHeader>
                        <CardContent>
                            <DonationGridSkeleton count={4} className="grid-cols-1 sm:grid-cols-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <BreathingContainer delay={0.5}>
                                <Shimmer height="1.25rem" width="8rem" rounded="md" />
                            </BreathingContainer>
                        </CardHeader>
                        <CardContent>
                            <TextSkeleton lines={5} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    BreathingContainer,
};
