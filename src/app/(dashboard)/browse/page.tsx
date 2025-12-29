"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonationGrid } from "@/components/donations/DonationGrid";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Donation,
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

                <MagneticButton
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                    magneticStrength={0.2}
                >
                    <RefreshCw className={cn(
                        "h-4 w-4",
                        isRefreshing && "animate-spin"
                    )} />
                    Refresh
                </MagneticButton>
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

            {/* Content - Using shared DonationGrid with StaggerContainer */}
            <DonationGrid
                donations={filteredDonations}
                isLoading={isLoading}
                enableLayoutAnimation={false}
            />

            {/* Results Count */}
            {!isLoading && filteredDonations.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                    Showing {filteredDonations.length} of {stats.total} donations
                </p>
            )}
        </div>
    );
}
