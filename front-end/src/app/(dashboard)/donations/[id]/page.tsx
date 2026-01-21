"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Soup, ExternalLink, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PickupControl } from "@/components/donations/details/PickupControl";
import { DonationTimeline } from "@/components/donations/details/DonationTimeline";
import { VolunteerInfo } from "@/components/donations/details/VolunteerInfo";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { ClaimButton, ReservedBadge } from "@/components/donations/claim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonationMapSkeleton } from "@/components/map/MapSkeleton";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
    Donation,
    DonationStatus,
    FoodType,
    isDonationAvailable,
} from "@/types/donation";
import { formatFoodType } from "@/lib/utils/formatters";

// Dynamic import for map to avoid SSR issues with Leaflet
const DonationMap = dynamic(
    () => import("@/components/map/DonationMap").then((mod) => mod.DonationMap),
    {
        ssr: false,
        loading: () => <DonationMapSkeleton height="200px" />,
    }
);

// =============================================================================
// VIEW TYPES
// =============================================================================

/**
 * Possible view modes for the donation detail page based on user role and donation state
 */
type ViewMode =
    | "donor_owner"           // Current user is the donor who created this
    | "volunteer_available"   // Volunteer viewing an available donation
    | "volunteer_claimed"     // Volunteer who claimed this donation
    | "volunteer_reserved"    // Volunteer viewing a donation claimed by someone else
    | "recipient_view"        // Recipient viewing a donation
    | "guest_view";           // Unauthenticated or unknown state

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DonationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [donation, setDonation] = useState<Donation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------

    useEffect(() => {
        const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
        const donationId = Number(idParam);
        if (!donationId) return;

        const fetchDonation = async () => {
            try {
                const response = await api.donations.get(donationId);

                // Safely unwrap nested data structure from Laravel
                let data: unknown = response;
                if ((response as { data?: unknown }).data) {
                    data = (response as { data?: unknown }).data;
                }
                // Handle double-wrapped responses
                if ((data as { data?: unknown }).data) {
                    data = (data as { data?: unknown }).data;
                }

                setDonation(data as Donation);
            } catch (error) {
                console.error("Failed to fetch donation:", error);
                const apiError = error as ApiError;
                if (apiError?.status === 404) {
                    setNotFound(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonation();
    }, [params?.id]);

    // -------------------------------------------------------------------------
    // VIEW MODE DETERMINATION (Bulletproof with Type Coercion)
    // -------------------------------------------------------------------------

    const viewMode = useMemo<ViewMode>(() => {
        // 🔍 DEBUG: Log current state
        console.log("🔍 [Detail] Computing viewMode...");
        console.log("🔍 [Detail] Raw donation object:", donation);
        console.log("🔍 [Detail] Raw user object:", user);

        // CRITICAL: Don't default to guest while still loading
        if (!donation) {
            console.log("⏳ [Detail] No donation yet, returning guest_view");
            return "guest_view";
        }

        if (!user) {
            console.log("⏳ [Detail] No user yet, returning guest_view");
            return "guest_view";
        }

        // =================================================================
        // BULLETPROOF DONOR ID EXTRACTION
        // Backend returns donor as object { id, name } OR donor_id as number
        // Handle BOTH cases with fallback chain
        // =================================================================
        const normalizeId = (id: unknown): string => {
            if (id === null || id === undefined) return "";
            return String(id).trim();
        };

        const userId = normalizeId(user.id);

        // Extract donor ID from multiple possible locations
        // Priority: donor.id (object) > donor_id (direct field)
        const donorIdRaw = donation.donor?.id ?? donation.donor_id ?? null;
        const donorId = normalizeId(donorIdRaw);

        const userRole = user.roles?.[0]?.toLowerCase() ?? "";

        console.log("👮 [Detail] ID Comparison:", {
            userId,
            donorId,
            donorIdRaw,
            donorObject: donation.donor,
            donorIdDirect: donation.donor_id,
            areEqual: userId !== "" && donorId !== "" && userId === donorId,
            userRole,
        });

        // Check if current user is the donation owner (donor)
        // Using normalized string comparison with non-empty check
        if (userId !== "" && donorId !== "" && userId === donorId) {
            console.log("✅ [Detail] User IS the donor owner");
            return "donor_owner";
        }

        // For volunteers
        if (userRole === "volunteer") {
            // Check if donation is available for claiming
            if (isDonationAvailable(donation)) {
                console.log("✅ [Detail] Volunteer can claim (donation available)");
                return "volunteer_available";
            }

            // Check if this volunteer claimed it
            if (donation.claim) {
                const claimVolunteerId = normalizeId(donation.claim.volunteer_id);
                console.log("👮 [Detail] Claim comparison:", { claimVolunteerId, userId, match: claimVolunteerId === userId });

                if (claimVolunteerId === userId) {
                    console.log("✅ [Detail] Volunteer owns this claim");
                    return "volunteer_claimed";
                }

                console.log("✅ [Detail] Donation reserved by another volunteer");
                return "volunteer_reserved";
            }

            return "volunteer_available";
        }

        // For donors viewing other people's donations
        if (userRole === "donor") {
            console.log("✅ [Detail] Donor viewing (not owner)");
            return "recipient_view"; // Donors can view but not claim
        }

        // Recipients and other roles
        if (userRole === "recipient") {
            console.log("✅ [Detail] Recipient view");
            return "recipient_view";
        }

        console.log("⚠️ [Detail] Fallback to guest_view");
        return "guest_view";
    }, [donation, user]);

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------

    const foodTypeLabel = useMemo(() => {
        return formatFoodType(donation?.food_type);
    }, [donation]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClaimSuccess = useCallback((_pickupCode: string) => {
        // Refresh donation data to show updated status
        // Note: _pickupCode is provided by ClaimButton but we refresh the whole donation
        if (donation) {
            setDonation({
                ...donation,
                status: DonationStatus.Claimed,
                claim: {
                    id: Date.now(), // Temporary ID until refresh
                    donation_id: donation.id,
                    volunteer_id: user?.id ?? 0,
                    status: "active",
                    picked_up_at: null,
                    delivered_at: null,
                    notes: null,
                    created_at: new Date().toISOString(),
                },
            });
        }
        router.refresh();
    }, [donation, user?.id, router]);

    const handleNavigateToMap = useCallback(() => {
        const lat = donation?.latitude;
        const lng = donation?.longitude;
        const address = donation?.pickup_address;

        let url = "";
        // Check for valid coordinates (not null/undefined/0)
        const hasValidCoords = lat != null && lng != null && 
            Number.isFinite(lat) && Number.isFinite(lng) &&
            !(lat === 0 && lng === 0);
        
        if (hasValidCoords) {
            url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        } else if (address && address.trim()) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        }

        if (url) {
            window.open(url, "_blank");
        }
    }, [donation]);

    // -------------------------------------------------------------------------
    // RENDER: Loading State
    // -------------------------------------------------------------------------

    if (isLoading || authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading donation" />
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: Not Found State
    // -------------------------------------------------------------------------

    if (notFound || !donation) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-lg font-semibold">Donation not found</p>
                <p className="text-sm text-muted-foreground">
                    It may have been removed or the link is invalid.
                </p>
                <Button onClick={() => router.push("/donations")}>
                    Back to Donations
                </Button>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: Main Content
    // -------------------------------------------------------------------------

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-semibold">
                            {donation.title}
                        </CardTitle>
                        <StatusBadge status={donation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Expires {new Date(donation.expires_at).toLocaleString()}
                    </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href={viewMode === "donor_owner" ? "/donations" : "/browse"}>
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Donation Details Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="space-y-1">
                            <p className="text-xs uppercase text-muted-foreground">
                                Food Type
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Soup className="h-4 w-4" aria-hidden />
                                {foodTypeLabel}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs uppercase text-muted-foreground">
                                    Description
                                </p>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {donation.description ?? "No description provided"}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <span className="font-semibold">
                                        {donation.quantity ?? "N/A"} kg
                                    </span>
                                </div>
                                <div
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:bg-secondary/50"
                                    onClick={handleNavigateToMap}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && handleNavigateToMap()}
                                >
                                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                                    <span className="font-medium">
                                        {donation.pickup_address || "N/A"}
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </div>
                            
                            {/* Location Map Preview */}
                            {donation.latitude && donation.longitude && 
                             !(donation.latitude === 0 && donation.longitude === 0) && (
                                <div className="space-y-2 pt-2">
                                    <p className="text-xs uppercase text-muted-foreground">
                                        Pickup Location
                                    </p>
                                    <div className="overflow-hidden rounded-lg border border-border/70">
                                        <DonationMap
                                            donations={[donation]}
                                            center={{ latitude: donation.latitude, longitude: donation.longitude }}
                                            height="200px"
                                            autoFitBounds={false}
                                            showDistance={false}
                                            zoom={15}
                                            onDonationClick={handleNavigateToMap}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <DonationTimeline donation={donation} />
                </div>

                {/* Sidebar - Role-Based Controls */}
                <div className="space-y-4 lg:sticky lg:top-4">
                    {/* 
                     * ROLE-BASED VIEW SWITCH
                     * ----------------------
                     * Different UI based on who is viewing and donation state
                     */}

                    {/* DONOR VIEW: Show pickup controls and volunteer info */}
                    {viewMode === "donor_owner" && (
                        <>
                            <PickupControl donation={donation} />
                            <VolunteerInfo donation={donation} />
                        </>
                    )}

                    {/* VOLUNTEER: Available donation - Show claim button */}
                    {viewMode === "volunteer_available" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="shadow-sm">
                                <CardContent className="space-y-4 p-4">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            This donation is available
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Claim it to start the pickup process
                                        </p>
                                    </div>
                                    <ClaimButton
                                        donation={donation}
                                        onClaimSuccess={handleClaimSuccess}
                                        className="w-full"
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* VOLUNTEER: Claimed by this user - Show pickup controls */}
                    {viewMode === "volunteer_claimed" && (
                        <>
                            <ReservedBadge
                                claim={donation.claim}
                                isOwner={true}
                            />
                            <PickupControl donation={donation} />
                        </>
                    )}

                    {/* VOLUNTEER: Reserved by someone else */}
                    {viewMode === "volunteer_reserved" && (
                        <ReservedBadge
                            claim={donation.claim}
                            isOwner={false}
                        />
                    )}

                    {/* RECIPIENT VIEW: Basic info only */}
                    {viewMode === "recipient_view" && (
                        <Card className="shadow-sm">
                            <CardContent className="p-4 text-center text-sm text-muted-foreground">
                                {isDonationAvailable(donation) ? (
                                    <p>This donation is available for volunteers to claim.</p>
                                ) : (
                                    <p>This donation is being processed by a volunteer.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* GUEST VIEW: Prompt to login */}
                    {viewMode === "guest_view" && (
                        <Card className="shadow-sm">
                            <CardContent className="space-y-3 p-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Sign in to interact with this donation
                                </p>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}