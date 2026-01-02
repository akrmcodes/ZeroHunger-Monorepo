"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Loader2 } from "lucide-react";
import {
    Pie,
    PieChart,
    ResponsiveContainer,
    Cell,
    Tooltip,
    type TooltipProps,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

import { ActionBanner } from "@/components/dashboard/shared/ActionBanner";
import { ActivityList } from "@/components/dashboard/shared/ActivityList";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { containerVariants, itemVariants } from "@/components/dashboard/shared/variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getImpactLevel } from "@/lib/utils/profile-simulation";
import type { Donation } from "@/types/donation";

type StatusDatum = {
    name: string;
    value: number;
    color: string;
};

// =============================================================================
// SAFE DATA NORMALIZATION
// =============================================================================

/**
 * Safely extracts an array from API response.
 * Handles multiple response formats:
 * - Direct array: [...]
 * - Wrapped: { data: [...] }
 * - Nested: { data: { data: [...] } }
 * @returns Always returns an array (empty if extraction fails)
 */
function safeArrayExtract<T>(response: unknown): T[] {
    // Case 1: Already an array
    if (Array.isArray(response)) {
        return response;
    }

    // Case 2: Response is an object with a data property
    if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as { data: unknown }).data;

        // Case 2a: data is directly an array
        if (Array.isArray(data)) {
            return data;
        }

        // Case 2b: data is wrapped again (ApiResponse wrapper from useQuery)
        if (data && typeof data === 'object' && 'data' in data) {
            const nestedData = (data as { data: unknown }).data;
            if (Array.isArray(nestedData)) {
                return nestedData;
            }
        }
    }

    // Fallback: return empty array to prevent crashes
    return [];
}

// =============================================================================
// REAL DATA COMPUTATION UTILITIES
// =============================================================================

/** Average meals per KG of food (industry standard: ~2.5 meals per kg) */
const MEALS_PER_KG = 2.5;

/**
 * Compute REAL stats directly from the donation list.
 * This is the Source of Truth - no heuristics, no simulation.
 */
function computeRealDonorStats(donations: Donation[]) {
    const totalDonations = donations.length;

    // Sum actual quantity_kg from each donation
    const totalKgSaved = donations.reduce((sum, d) => {
        // Handle both quantity_kg (API) and quantity (form) field names
        const kg = (d as { quantity_kg?: number }).quantity_kg ?? d.quantity ?? 0;
        return sum + kg;
    }, 0);

    // Calculate meals from real KG data
    const mealsProvided = Math.round(totalKgSaved * MEALS_PER_KG);

    return {
        totalDonations,
        totalKgSaved: Math.round(totalKgSaved * 10) / 10, // Round to 1 decimal
        mealsProvided,
    };
}

/**
 * Compute status breakdown from REAL donation statuses
 */
function computeStatusData(donations: Donation[]): StatusDatum[] {
    const pending = donations.filter(d =>
        d.status === "available" || d.status === "pending"
    ).length;
    const claimed = donations.filter(d =>
        d.status === "reserved" || d.status === "claimed" || d.status === "picked_up"
    ).length;
    const delivered = donations.filter(d =>
        d.status === "delivered"
    ).length;

    return [
        { name: "Pending", value: pending || 0, color: "#94a3b8" },
        { name: "Claimed", value: claimed || 0, color: "#f59e0b" },
        { name: "Delivered", value: delivered || 0, color: "#10b981" },
    ];
}

/**
 * Generate activity items from REAL recent donations
 */
function generateActivityFromDonations(donations: Donation[]) {
    // Sort by created_at descending and take 5 most recent
    const sorted = [...donations]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return sorted.map(d => {
        const date = new Date(d.created_at);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let time: string;
        if (diffHours < 1) time = "Just now";
        else if (diffHours < 24) time = `${diffHours}h ago`;
        else if (diffDays === 1) time = "Yesterday";
        else time = `${diffDays} days ago`;

        return {
            title: `Donated: ${d.title}`,
            time,
        };
    });
}

interface ImpactRingProps {
    progress: number;
}

function ImpactRing({ progress }: ImpactRingProps) {
    const percentage = Math.round(progress);
    return (
        <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" className="stroke-emerald-100" strokeWidth="10" fill="none" />
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-emerald-500"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${(progress / 100) * 264} 999`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{percentage}%</span>
                <span className="text-xs text-slate-500">to next level</span>
            </div>
        </div>
    );
}

type StatusTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{ name?: string; value?: number }>;
    label?: string | number;
};

function StatusTooltip({ active, payload }: StatusTooltipProps) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    if (item?.name == null || item?.value == null) return null;

    return (
        <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-slate-600">{item.value} donations</p>
        </div>
    );
}

export function DonorDashboard() {
    const { user } = useAuth();

    // =========================================================================
    // REAL DATA FETCHING - Source of Truth from API
    // Endpoint: GET /my-donations (returns all donations by current donor)
    // =========================================================================
    const {
        data: donationsResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["my-donations", user?.id],
        queryFn: () => api.donations.myDonations(),
        enabled: !!user,
        staleTime: 30 * 1000, // 30 seconds
    });

    // =========================================================================
    // SAFE ARRAY EXTRACTION - Defensive coding to prevent crashes
    // Handles: direct array, { data: [...] }, or { data: { data: [...] } }
    // =========================================================================
    const donations = useMemo(() => {
        return safeArrayExtract<Donation>(donationsResponse);
    }, [donationsResponse]);

    // Compute REAL stats from actual data (only when we have a safe array)
    const realStats = useMemo(() => {
        return computeRealDonorStats(donations);
    }, [donations]);

    const impactLevel = useMemo(() => {
        return getImpactLevel(user?.impact_score ?? 0);
    }, [user?.impact_score]);

    // Compute status breakdown from REAL donation statuses
    const statusData = useMemo(() => {
        return computeStatusData(donations);
    }, [donations]);

    // Generate activity from REAL recent donations
    const activityItems = useMemo(() => {
        return generateActivityFromDonations(donations);
    }, [donations]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-slate-600">Loading your donations...</span>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                Failed to load donation data. Please try refreshing.
            </div>
        );
    }

    const displayStats = [
        {
            title: "Total Donations",
            value: realStats.totalDonations.toString(),
            helper: `${realStats.mealsProvided} meals provided`,
            accentClass: "bg-emerald-100 text-emerald-800",
        },
        {
            title: "Food Saved",
            value: `${realStats.totalKgSaved} kg`,
            helper: "From going to waste",
            accentClass: "bg-blue-100 text-blue-800",
        },
        {
            title: "Impact Score",
            value: (user?.impact_score ?? 0).toLocaleString(),
            helper: `${impactLevel.level} • Level ${impactLevel.tier}`,
            accentClass: "bg-amber-100 text-amber-800",
        },
    ];

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayStats.map((stat) => {
                    const isImpact = stat.title === "Impact Score";
                    return (
                        <motion.div key={stat.title} variants={itemVariants}>
                            <StatCard
                                title={stat.title}
                                value={stat.value}
                                helper={isImpact ? stat.helper : undefined}
                                badgeText={!isImpact ? stat.helper : undefined}
                                badgeClassName={!isImpact ? stat.accentClass : undefined}
                                endAddon={isImpact ? <ImpactRing progress={impactLevel.progress} /> : undefined}
                                tone="emerald"
                            />
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="h-full border-emerald-100/70 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ActivityList
                                items={activityItems}
                                tone="emerald"
                                emptyMessage="No activity yet. Create your first donation."
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="h-full border-emerald-100/70 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader>
                            <CardTitle>Donation Status</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={2}
                                    >
                                        {statusData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<StatusTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                                {statusData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={itemVariants}>
                <ActionBanner
                    title="Donate food now"
                    description="Create a new donation and connect with volunteers instantly."
                    icon={PlusCircle}
                    tone="emerald"
                    actions={[{ label: "Create Donation", href: "/donations/create" }]}
                />
            </motion.div>
        </motion.div>
    );
}

export default DonorDashboard;
