"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    MapPin,
    Search,
    Inbox,
    RefreshCw,
    Hand,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Donation,
    FoodType,
    FOOD_TYPE_LABELS,
    isDonationAvailable,
} from "@/types/donation";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type FilterTab = "all" | "pending" | "claimed";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: "all", label: "All Available" },
    { value: "pending", label: "Ready to Claim" },
    { value: "claimed", label: "In Progress" },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

// =============================================================================
// DONATION BROWSE CARD (Volunteer-Focused)
// =============================================================================

interface BrowseCardProps {
    donation: Donation;
}

function BrowseCard({ donation }: BrowseCardProps) {
    const expiresIn = donation.expires_at
        ? formatDistanceToNowStrict(new Date(donation.expires_at), { addSuffix: true })
        : "No expiry";

    const foodTypeLabel = donation.food_type
        ? FOOD_TYPE_LABELS[donation.food_type as FoodType] ?? String(donation.food_type).replace(/_/g, " ")
        : "Food";

    const isAvailable = isDonationAvailable(donation);

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn(
                "relative h-full overflow-hidden border border-border/60 shadow-sm transition-shadow hover:shadow-md",
                isAvailable && "border-l-4 border-l-emerald-500"
            )}>
                <CardHeader className="space-y-2 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-base font-semibold leading-tight">
                            {donation.title}
                        </CardTitle>
                        <StatusBadge status={donation.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {foodTypeLabel} • {donation.quantity ?? 0} kg
                    </p>
                </CardHeader>

                <CardContent className="space-y-3 pb-3">
                    {donation.pickup_address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="line-clamp-2">{donation.pickup_address}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-secondary text-secondary-foreground"
                        )}>
                            <Clock className="h-3 w-3" />
                            Expires {expiresIn}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                        Posted {formatDistanceToNowStrict(new Date(donation.created_at), { addSuffix: true })}
                    </p>
                    <Button
                        asChild
                        size="sm"
                        variant={isAvailable ? "default" : "outline"}
                        className={cn(isAvailable && "bg-emerald-600 hover:bg-emerald-700")}
                    >
                        <Link href={`/donations/${donation.id}`}>
                            {isAvailable ? (
                                <>
                                    <Hand className="mr-1.5 h-3.5 w-3.5" />
                                    Claim
                                </>
                            ) : (
                                "View Details"
                            )}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

// =============================================================================
// SKELETON LOADER
// =============================================================================

function BrowseGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
                <div
                    key={idx}
                    className="animate-pulse rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <div className="h-5 w-32 rounded bg-muted" />
                        <div className="h-5 w-16 rounded-full bg-muted" />
                    </div>
                    <div className="mb-2 h-4 w-20 rounded bg-muted" />
                    <div className="mb-4 h-4 w-3/4 rounded bg-muted" />
                    <div className="mb-4 h-6 w-28 rounded-full bg-muted" />
                    <div className="flex items-center justify-between border-t pt-3">
                        <div className="h-3 w-24 rounded bg-muted" />
                        <div className="h-8 w-20 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({
    hasFilters,
    onClearFilters
}: {
    hasFilters: boolean;
    onClearFilters: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-card/40 p-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Inbox className="h-7 w-7" />
            </div>
            <div>
                <p className="text-lg font-semibold">No donations found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasFilters
                        ? "Try adjusting your search or filters"
                        : "Check back later for new donations in your area"}
                </p>
            </div>
            {hasFilters && (
                <Button variant="outline" onClick={onClearFilters}>
                    Clear Filters
                </Button>
            )}
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function BrowseDonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterTab, setFilterTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------

    const fetchDonations = useCallback(async (showRefreshToast = false) => {
        try {
            const response = await api.donations.list();

            // 🔍 DEBUG: Log raw API response structure
            console.log("🔍 [Browse] Raw API Response:", response);
            console.log("🔍 [Browse] Response type:", typeof response);

            // =================================================================
            // BULLETPROOF DATA EXTRACTION
            // Handles: direct array, { data: [] }, { data: { data: [] } }, etc.
            // =================================================================
            const extractDonationsArray = (input: unknown): Donation[] => {
                // If it's already an array, return it
                if (Array.isArray(input)) {
                    console.log("✅ [Browse] Found direct array, length:", input.length);
                    return input as Donation[];
                }

                // If it's an object, try to find the array
                if (input && typeof input === "object") {
                    const obj = input as Record<string, unknown>;

                    // Check common wrapper keys in order of likelihood
                    const possibleKeys = ["data", "donations", "items", "results"];
                    for (const key of possibleKeys) {
                        if (key in obj) {
                            const nested = obj[key];
                            console.log(`🔍 [Browse] Found key "${key}", recursing...`);
                            return extractDonationsArray(nested);
                        }
                    }
                }

                console.warn("⚠️ [Browse] Could not extract donations array from:", input);
                return [];
            };

            const donationList = extractDonationsArray(response);
            console.log("✅ [Browse] Final donations count:", donationList.length);
            setDonations(donationList);

            if (showRefreshToast) {
                toast.success("Donations refreshed");
            }
        } catch (error) {
            const apiError = error as ApiError;
            toast.error("Failed to load donations", {
                description: apiError?.message ?? "Please try again later",
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDonations();
    }, [fetchDonations]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchDonations(true);
    }, [fetchDonations]);

    // -------------------------------------------------------------------------
    // FILTERING
    // -------------------------------------------------------------------------

    const filteredDonations = useMemo(() => {
        const normalized = searchQuery.trim().toLowerCase();

        return donations.filter((donation) => {
            // Status filter
            // IMPORTANT: Backend uses 'available' / 'reserved' while frontend uses 'pending' / 'claimed'
            // We must accept BOTH naming conventions
            const status = String(donation.status).toLowerCase();

            // Map backend statuses to categories
            const isAvailableStatus = ["pending", "available"].includes(status);
            const isClaimedStatus = ["claimed", "reserved", "picked_up"].includes(status);

            if (filterTab === "pending") {
                // "Ready to Claim" = pending OR available
                if (!isAvailableStatus) return false;
            } else if (filterTab === "claimed") {
                // "In Progress" = claimed, reserved, or picked_up
                if (!isClaimedStatus) return false;
            } else if (filterTab === "all") {
                // Show all active workflow items (exclude delivered, expired, cancelled)
                if (!isAvailableStatus && !isClaimedStatus) return false;
            }

            // Search filter
            if (normalized) {
                const matchesTitle = donation.title.toLowerCase().includes(normalized);
                const matchesAddress = donation.pickup_address?.toLowerCase().includes(normalized);
                return matchesTitle || matchesAddress;
            }

            return true;
        });
    }, [donations, filterTab, searchQuery]);

    const hasFilters = searchQuery.trim() !== "" || filterTab !== "all";

    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setFilterTab("all");
    }, []);

    // -------------------------------------------------------------------------
    // STATS
    // -------------------------------------------------------------------------

    const stats = useMemo(() => {
        // Count available donations (backend: 'available', frontend: 'pending')
        const pending = donations.filter(d => {
            const status = String(d.status).toLowerCase();
            return ["pending", "available"].includes(status);
        }).length;

        // Count in-progress donations (backend: 'reserved', frontend: 'claimed')
        const claimed = donations.filter(d => {
            const status = String(d.status).toLowerCase();
            return ["claimed", "reserved", "picked_up"].includes(status);
        }).length;

        return { pending, claimed, total: pending + claimed };
    }, [donations]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Browse Donations
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Find and claim donations in your area
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={cn(
                        "h-4 w-4",
                        isRefreshing && "animate-spin"
                    )} />
                    Refresh
                </Button>
            </div>

            {/* Stats Bar */}
            {!isLoading && (
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Available: </span>
                        <span className="font-semibold text-emerald-600">{stats.pending}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">In Progress: </span>
                        <span className="font-semibold text-blue-600">{stats.claimed}</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Tab Filters */}
                <div className="flex gap-2">
                    {FILTER_TABS.map((tab) => (
                        <Button
                            key={tab.value}
                            variant={filterTab === tab.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterTab(tab.value)}
                            className={cn(
                                filterTab === tab.value && "bg-primary"
                            )}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <BrowseGridSkeleton />
            ) : filteredDonations.length === 0 ? (
                <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
            ) : (
                <motion.div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {filteredDonations.map((donation) => (
                        <BrowseCard key={donation.id} donation={donation} />
                    ))}
                </motion.div>
            )}

            {/* Results Count */}
            {!isLoading && filteredDonations.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                    Showing {filteredDonations.length} of {stats.total} donations
                </p>
            )}
        </div>
    );
}
