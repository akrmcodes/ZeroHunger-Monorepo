"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, ShoppingBag, Soup, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
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

import { StatCard } from "@/components/dashboard/shared/StatCard";
import { containerVariants, itemVariants } from "@/components/dashboard/shared/variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Donation } from "@/types/donation";

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

/** Average savings per meal ($3-4 per meal is reasonable) */
const SAVINGS_PER_MEAL = 3.5;
/** Average meals per KG of food */
const MEALS_PER_KG = 2.5;

/**
 * Compute real nearby donations from the donations list.
 * Filters to only available donations.
 */
function computeNearbyItems(donations: Donation[]) {
    return donations
        .filter(d => d.status === "available" || d.status === "pending")
        .slice(0, 6) // Show max 6 nearby items
        .map(d => ({
            id: d.id,
            name: d.title,
            place: d.donor?.name ?? "Local Donor",
            distance: (d as { distance?: number }).distance
                ? `${(d as { distance?: number }).distance} km`
                : "Nearby",
            quantity: (d as { quantity_kg?: number }).quantity_kg ?? d.quantity ?? 0,
        }));
}

/**
 * Generate fake "meals received" data for chart.
 * NOTE: The API doesn't track what recipients have received.
 * This shows available meals in the system as potential access.
 */
function computeMealsData(donations: Donation[]) {
    // Group available donations by day of week for the chart
    // This shows "what's available" rather than "what was received"
    const dayMap: Record<string, number> = {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    donations.forEach(d => {
        const day = dayNames[new Date(d.created_at).getDay()];
        const kg = (d as { quantity_kg?: number }).quantity_kg ?? d.quantity ?? 0;
        const meals = Math.round(kg * MEALS_PER_KG);
        dayMap[day] += meals;
    });

    return [
        { day: "Mon", meals: dayMap.Mon },
        { day: "Tue", meals: dayMap.Tue },
        { day: "Wed", meals: dayMap.Wed },
        { day: "Thu", meals: dayMap.Thu },
        { day: "Fri", meals: dayMap.Fri },
        { day: "Sat", meals: dayMap.Sat },
        { day: "Sun", meals: dayMap.Sun },
    ];
}

type StatusTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{ payload?: { day?: string; meals?: number } }>;
    label?: string | number;
};

function StatusTooltip({ active, payload }: StatusTooltipProps) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
            <p className="font-semibold text-slate-900">{point.day}</p>
            <p className="text-slate-600">{point.meals ?? 0} meals received</p>
        </div>
    );
}

export function RecipientDashboard() {
    const { user } = useAuth();

    // =========================================================================
    // REAL DATA FETCHING - Source of Truth from API
    // Endpoint: GET /donations (returns all available donations)
    // =========================================================================
    const {
        data: donationsResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["available-donations"],
        queryFn: () => api.donations.list(),
        staleTime: 30 * 1000, // 30 seconds
    });

    // =========================================================================
    // SAFE ARRAY EXTRACTION - Defensive coding to prevent crashes
    // Handles: direct array, { data: [...] }, or { data: { data: [...] } }
    // =========================================================================
    const donations = useMemo(() => {
        return safeArrayExtract<Donation>(donationsResponse);
    }, [donationsResponse]);

    // Compute REAL nearby items from available donations (only when we have a safe array)
    const nearbyItems = useMemo(() => {
        return computeNearbyItems(donations);
    }, [donations]);

    // Compute meals availability data for chart
    const mealsData = useMemo(() => {
        return computeMealsData(donations);
    }, [donations]);

    // Calculate total available meals and estimated savings
    const totalAvailableKg = donations
        .filter(d => d.status === "available" || d.status === "pending")
        .reduce((sum, d) => {
            const kg = (d as { quantity_kg?: number }).quantity_kg ?? d.quantity ?? 0;
            return sum + kg;
        }, 0);

    const totalAvailableMeals = Math.round(totalAvailableKg * MEALS_PER_KG);
    const estimatedSavings = Math.round(totalAvailableMeals * SAVINGS_PER_MEAL);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-slate-600">Finding food near you...</span>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                Failed to load available donations. Please try refreshing.
            </div>
        );
    }

    const hasNearby = nearbyItems.length > 0;

    // Generate stats from REAL available donations
    const displayStats = [
        { title: "Nearby Donations", value: String(nearbyItems.length), icon: MapPin },
        { title: "Available Meals", value: totalAvailableMeals.toString(), icon: ShoppingBag },
    ];

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="rounded-2xl bg-gradient-to-r from-orange-100 via-white to-orange-50 p-5 shadow-sm ring-1 ring-orange-100/60">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">ZeroHunger</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Find food nearby</h2>
                <p className="text-sm text-slate-700">
                    Safe, dignified access to surplus food. {totalAvailableMeals} meals available worth ~${estimatedSavings}!
                </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
                {displayStats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            iconBackground="bg-orange-100 text-orange-700"
                            tone="orange"
                        />
                    </motion.div>
                ))}
            </div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardHeader>
                        <CardTitle>Nearby Available Food</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasNearby ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {nearbyItems.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-base font-semibold text-slate-900">{item.name}</p>
                                                <p className="text-sm text-slate-700">{item.place}</p>
                                                <p className="text-xs text-orange-700">{item.distance} • {item.quantity} kg</p>
                                            </div>
                                            <Soup className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div className="mt-3">
                                            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                                                <Link href={`/donations/${item.id}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/60 p-4 text-center text-sm text-slate-600">
                                No donations nearby yet. We&apos;ll notify you.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                                <UtensilsCrossed className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-900">View all on map</p>
                                <p className="text-sm text-slate-600">See every available donation pinned nearby.</p>
                            </div>
                        </div>
                        <Button asChild className="bg-orange-500 px-5 hover:bg-orange-600">
                            <Link href="/donations/nearby">Open Map</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardHeader>
                        <CardTitle>Available Meals by Day</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mealsData}>
                                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                                <Tooltip content={<StatusTooltip />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
                                <Bar dataKey="meals" radius={[8, 8, 4, 4]} fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

export default RecipientDashboard;
