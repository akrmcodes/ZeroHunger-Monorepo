"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, MapPin, Navigation, Scale, Search } from "lucide-react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

import { ActionBanner } from "@/components/dashboard/shared/ActionBanner";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { containerVariants, itemVariants } from "@/components/dashboard/shared/variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api, type Claim } from "@/lib/api";

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

/**
 * Compute REAL stats directly from the claims list.
 * This is the Source of Truth - no heuristics, no simulation.
 */
function computeRealVolunteerStats(claims: Claim[]) {
    // Active claims: status is "active" or "picked_up" (not yet delivered)
    const activeClaims = claims.filter(c =>
        c.status === "active" || c.status === "picked_up"
    );

    // Completed deliveries: status is "delivered"
    const completedDeliveries = claims.filter(c => c.status === "delivered");

    // Calculate total KG delivered from real donation data
    const totalKgDelivered = completedDeliveries.reduce((sum, c) => {
        const kg = (c.donation as { quantity_kg?: number })?.quantity_kg ??
            c.donation?.quantity ?? 0;
        return sum + kg;
    }, 0);

    return {
        activeClaims: activeClaims.length,
        completedDeliveries: completedDeliveries.length,
        totalKgDelivered: Math.round(totalKgDelivered * 10) / 10,
        // Get the first active claim for current mission
        currentMission: activeClaims[0] ?? null,
    };
}

/**
 * Compute REAL weekly activity from delivered claims with timestamps
 */
function computeWeeklyData(claims: Claim[]) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter to delivered claims from the last 7 days
    const recentDeliveries = claims.filter(c => {
        if (c.status !== "delivered" || !c.delivered_at) return false;
        const deliveredDate = new Date(c.delivered_at);
        return deliveredDate >= oneWeekAgo;
    });

    // Group by day of week
    const dayMap: Record<string, number> = {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };
    const dayNames: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    recentDeliveries.forEach(c => {
        if (c.delivered_at) {
            const day = dayNames[new Date(c.delivered_at).getDay()];
            if (day && day in dayMap) {
                dayMap[day]!++;
            }
        }
    });

    return [
        { day: "Mon", deliveries: dayMap.Mon },
        { day: "Tue", deliveries: dayMap.Tue },
        { day: "Wed", deliveries: dayMap.Wed },
        { day: "Thu", deliveries: dayMap.Thu },
        { day: "Fri", deliveries: dayMap.Fri },
        { day: "Sat", deliveries: dayMap.Sat },
        { day: "Sun", deliveries: dayMap.Sun },
    ];
}

type StatusTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{ payload?: { day?: string; deliveries?: number } }>;
    label?: string | number;
};

function StatusTooltip({ active, payload }: StatusTooltipProps) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
            <p className="font-semibold text-slate-900">{point.day}</p>
            <p className="text-slate-600">{point.deliveries ?? 0} deliveries</p>
        </div>
    );
}

export function VolunteerDashboard() {
    const { user } = useAuth();

    // =========================================================================
    // REAL DATA FETCHING - Source of Truth from API
    // Endpoint: GET /claims (returns all claims by current volunteer)
    // =========================================================================
    const {
        data: claimsResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["my-claims", user?.id],
        queryFn: () => api.claims.list(),
        enabled: !!user,
        staleTime: 30 * 1000, // 30 seconds
    });

    // =========================================================================
    // SAFE ARRAY EXTRACTION - Defensive coding to prevent crashes
    // Handles: direct array, { data: [...] }, or { data: { data: [...] } }
    // =========================================================================
    const claims = useMemo(() => {
        return safeArrayExtract<Claim>(claimsResponse);
    }, [claimsResponse]);

    // Compute REAL stats from actual data (only when we have a safe array)
    const realStats = useMemo(() => {
        return computeRealVolunteerStats(claims);
    }, [claims]);

    // Compute REAL weekly activity from delivered claims
    const weeklyData = useMemo(() => {
        return computeWeeklyData(claims);
    }, [claims]);

    const thisWeekDeliveries = weeklyData.reduce((sum, d) => sum + (d.deliveries ?? 0), 0);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading your deliveries...</span>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                Failed to load delivery data. Please try refreshing.
            </div>
        );
    }

    const displayStats = [
        {
            title: "Active Claims",
            value: realStats.activeClaims.toString(),
            helper: `${Math.min(realStats.activeClaims, 2)} pickups pending`,
            icon: MapPin,
            accent: "text-blue-700 bg-blue-100",
        },
        {
            title: "Completed Deliveries",
            value: realStats.completedDeliveries.toString(),
            helper: `+${thisWeekDeliveries} this week`,
            icon: CheckCircle,
            accent: "text-emerald-700 bg-emerald-100",
        },
        {
            title: "Total Impact",
            value: `${realStats.totalKgDelivered} kg`,
            helper: `${claims.length} total claims`,
            icon: Scale,
            accent: "text-indigo-700 bg-indigo-100",
        },
    ];

    const hasActiveMission = realStats.currentMission !== null;
    const mission = realStats.currentMission ? {
        pickup: realStats.currentMission.donation?.title ?? "Pickup Location",
        dropoff: "Recipient Location",
        eta: "Awaiting pickup",
        claimId: realStats.currentMission.id,
    } : null;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayStats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            helper={stat.helper}
                            icon={stat.icon}
                            iconBackground={stat.accent}
                            tone="blue"
                        />
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="h-full border-blue-100/70 bg-blue-50/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>Current Mission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {hasActiveMission && mission ? (
                                <div className="rounded-xl border border-blue-100 bg-white/90 p-4 shadow-sm">
                                    <div className="flex flex-col gap-2 text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                            <span className="font-semibold">Pickup:</span>
                                            <span>{mission.pickup}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Navigation className="h-4 w-4 text-emerald-600" />
                                            <span className="font-semibold">Deliver to:</span>
                                            <span>{mission.dropoff}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">ETA: {mission.eta}</p>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                            Mark Picked Up
                                        </Button>
                                        <Button className="bg-blue-600 hover:bg-blue-700">Navigate</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-blue-100 bg-white/90 p-4 text-slate-700 shadow-sm">
                                    <p className="font-semibold text-slate-900">No active missions</p>
                                    <p className="text-sm text-slate-600">Find a donation to claim and start helping.</p>
                                    <div className="mt-3">
                                        <Button className="bg-blue-600 hover:bg-blue-700">Find Donations</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="h-full border-blue-100/70 bg-white/90 shadow-sm backdrop-blur">
                        <CardHeader>
                            <CardTitle>Weekly Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                                    <Tooltip content={<StatusTooltip />} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
                                    <Bar dataKey="deliveries" radius={[8, 8, 4, 4]} fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={itemVariants}>
                <ActionBanner
                    title="Quick actions"
                    description="Find new donations or review your history."
                    icon={Search}
                    tone="blue"
                    actions={[
                        { label: "Find Donations", href: "/claims" },
                        { label: "My History", href: "/claims", variant: "outline" },
                    ]}
                />
            </motion.div>
        </motion.div>
    );
}

export default VolunteerDashboard;
