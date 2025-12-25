"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Inbox, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ClaimCard, type ClaimWithDonation } from "@/components/claims/ClaimCard";
import { ClaimsStats } from "@/components/claims/ClaimsStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type ApiError } from "@/lib/api";
import { Claim } from "@/types/claim";

type FilterTab = "active" | "all" | "history";

const TAB_OPTIONS: { value: FilterTab; label: string; helper: string }[] = [
    { value: "active", label: "Active", helper: "Active + In transit" },
    { value: "all", label: "All", helper: "Every claim" },
    { value: "history", label: "History", helper: "Delivered + Cancelled" },
];

const skeletonItems = Array.from({ length: 3 });

function ClaimsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skeletonItems.map((_, idx) => (
                <Card key={idx} className="border border-border/70">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-card/40 p-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Inbox className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <p className="text-lg font-semibold">No active missions</p>
                <p className="text-sm text-muted-foreground">Go to Browse to find a donation!</p>
            </div>
            <Button asChild variant="default" size="sm" className="gap-2">
                <Link href="/browse">
                    <Compass className="h-4 w-4" />
                    Browse donations
                </Link>
            </Button>
        </div>
    );
}

function computeImpactScore(claims: Claim[]): number {
    return claims.reduce((score, claim) => {
        const status = String(claim.status).toLowerCase();
        if (status === "delivered") return score + 20;
        if (status === "picked_up") return score + 12;
        if (status === "active") return score + 8;
        return score;
    }, 0);
}

function filterClaimsByTab(claims: ClaimWithDonation[], tab: FilterTab): ClaimWithDonation[] {
    return claims.filter((claim) => {
        const status = String(claim.status).toLowerCase();
        const isActive = status === "active" || status === "picked_up";
        const isHistory = status === "delivered" || status === "cancelled";

        if (tab === "active") return isActive;
        if (tab === "history") return isHistory;
        return true;
    });
}

function normalizeClaims(input: unknown): ClaimWithDonation[] {
    const extractArray = (value: unknown): ClaimWithDonation[] => {
        if (Array.isArray(value)) return value as ClaimWithDonation[];
        if (value && typeof value === "object") {
            const obj = value as Record<string, unknown>;
            const keys = ["data", "claims", "items", "results"];
            for (const key of keys) {
                if (key in obj) return extractArray(obj[key]);
            }
        }
        return [];
    };

    return extractArray(input).map((claim) => ({ ...claim }));
}

export default function ClaimsPage() {
    const [claims, setClaims] = useState<ClaimWithDonation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<FilterTab>("active");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchClaims = useCallback(async (showToast?: boolean) => {
        try {
            const response = await api.claims.list();
            const normalized = normalizeClaims(response);
            setClaims(normalized);
            if (showToast) toast.success("Claims refreshed");
        } catch (error) {
            const apiError = error as ApiError;
            toast.error("Failed to load claims", { description: apiError?.message ?? "Please try again" });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const activeClaims = useMemo(
        () => claims.filter((claim) => ["active", "picked_up"].includes(String(claim.status).toLowerCase())),
        [claims]
    );

    const deliveredClaims = useMemo(
        () => claims.filter((claim) => String(claim.status).toLowerCase() === "delivered"),
        [claims]
    );

    const filteredClaims = useMemo(() => filterClaimsByTab(claims, tab), [claims, tab]);

    const impactScore = useMemo(() => computeImpactScore(claims), [claims]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchClaims(true);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-primary">Mission Control</p>
                    <h1 className="text-2xl font-bold leading-tight text-foreground">My Deliveries</h1>
                    <p className="text-sm text-muted-foreground">Track active missions, pickups, and deliveries in one view.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                </div>
            </div>

            <ClaimsStats total={claims.length} active={activeClaims.length} impactScore={impactScore} />

            <Tabs value={tab} onValueChange={(value) => setTab(value as FilterTab)} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList>
                        {TAB_OPTIONS.map((option) => (
                            <TabsTrigger key={option.value} value={option.value} className="flex items-center gap-2">
                                <span>{option.label}</span>
                                <span className="text-[11px] font-normal text-muted-foreground">{option.helper}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>One tap to copy pickup codes or open maps.</span>
                    </div>
                </div>

                <TabsContent value={tab} className="space-y-4">
                    {isLoading ? (
                        <ClaimsGridSkeleton />
                    ) : filteredClaims.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                            initial="hidden"
                            animate="show"
                            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                        >
                            {filteredClaims.map((claim, idx) => (
                                <ClaimCard key={claim.id} claim={claim} index={idx} onStatusChange={() => fetchClaims()} />
                            ))}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>

            {!isLoading && filteredClaims.length === 0 && tab === "history" && deliveredClaims.length > 0 && (
                <p className="text-xs text-muted-foreground">Delivered items are in history. Switch tabs to view active missions.</p>
            )}
        </div>
    );
}
