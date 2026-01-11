"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    MapPin,
    List,
    Map as MapIcon,
    Filter,
    RefreshCcw,
    Navigation,
    AlertCircle,
    Loader2,
    UserCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation, formatDistance, calculateDistance } from "@/hooks/useGeolocation";
import type { Donation } from "@/types/donation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonationMap } from "@/components/map/DonationMap";
import { DonationCard } from "@/components/donations/DonationCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =============================================================================
// CONSTANTS
// =============================================================================

const RADIUS_OPTIONS = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
] as const;

const DEFAULT_RADIUS = 10;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type ViewMode = "map" | "list";

interface DonationWithDistance extends Donation {
    distance: number;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function RadiusSelector({
    value,
    onChange,
}: {
    value: number;
    onChange: (radius: number) => void;
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Radius:</span>
            <div className="flex gap-1">
                {RADIUS_OPTIONS.map((option) => (
                    <Button
                        key={option.value}
                        variant={value === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onChange(option.value)}
                        className="px-3"
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function ViewToggle({
    value,
    onChange,
}: {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}) {
    return (
        <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map" className="gap-2">
                    <MapIcon className="h-4 w-4" />
                    Map
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}

function LocationStatus({
    isDefault,
    isLoading,
    error,
    onRefresh,
    hasProfileLocation,
}: {
    isDefault: boolean;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    hasProfileLocation: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting your location...</span>
            </div>
        );
    }

    // User has a saved location in their profile - highest priority
    if (hasProfileLocation) {
        return (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                <UserCircle className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                        Using your saved location
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs truncate">
                        Showing donations near your registered location.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="gap-1.5 border-blue-300 shrink-0"
                >
                    <Navigation className="h-4 w-4" />
                    <span className="hidden sm:inline">Use GPS</span>
                </Button>
            </div>
        );
    }

    if (isDefault || error) {
        return (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                        Using default location
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-xs truncate">
                        {error || "GPS unavailable. Showing donations near city center."}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="gap-1.5 border-amber-300 shrink-0"
                >
                    <Navigation className="h-4 w-4" />
                    <span className="hidden sm:inline">Retry GPS</span>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Using your current GPS location</span>
            <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
                title="Refresh location"
            >
                <RefreshCcw className="h-3 w-3" />
            </Button>
        </div>
    );
}

function DonationListView({
    donations,
    isLoading,
    onDonationClick,
}: {
    donations: DonationWithDistance[];
    isLoading: boolean;
    onDonationClick: (donation: Donation) => void;
}) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-32 w-full" />
                        <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (donations.length === 0) {
        return (
            <Card className="p-8">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">No donations found nearby</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Try increasing the search radius or check back later.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Found {donations.length} donation{donations.length !== 1 ? "s" : ""} nearby
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {donations.map((donation, index) => (
                        <motion.div
                            key={donation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div
                                className="cursor-pointer transition-transform hover:scale-[1.02]"
                                onClick={() => onDonationClick(donation)}
                            >
                                <DonationCard
                                    donation={donation}
                                    distanceLabel={formatDistance(donation.distance)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function NearbyDonationsPage() {
    const router = useRouter();
    const { user } = useAuth();

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>("map");
    const [radius, setRadius] = useState(DEFAULT_RADIUS);
    const [useGpsOverride, setUseGpsOverride] = useState(false);

    // Check if user has a saved location in their profile
    const hasProfileLocation = user?.latitude != null && user?.longitude != null;

    // Geolocation with smart fallback
    const {
        coordinates: gpsCoordinates,
        isLoading: isLocating,
        error: locationError,
        isDefault: isGpsDefault,
        refresh: refreshGps,
    } = useGeolocation({
        // Only auto-fetch GPS if no profile location OR user explicitly wants GPS
        autoFetch: !hasProfileLocation || useGpsOverride,
        timeout: 3000,
        // Use profile location as fallback if available
        fallbackLocation: hasProfileLocation
            ? { latitude: user!.latitude!, longitude: user!.longitude! }
            : undefined,
    });

    // Determine effective coordinates: prefer profile location unless GPS override is active
    const effectiveCoordinates = useMemo(() => {
        if (hasProfileLocation && !useGpsOverride) {
            return { latitude: user!.latitude!, longitude: user!.longitude! };
        }
        return gpsCoordinates;
    }, [hasProfileLocation, useGpsOverride, user, gpsCoordinates]);

    // Determine if we're using the system default (not profile, not real GPS)
    const isUsingDefault = !hasProfileLocation && isGpsDefault && !useGpsOverride;

    // Handle refresh - if using profile location, switch to GPS mode
    const refreshLocation = useCallback(async () => {
        if (hasProfileLocation && !useGpsOverride) {
            setUseGpsOverride(true);
        }
        await refreshGps();
    }, [hasProfileLocation, useGpsOverride, refreshGps]);

    // Fetch nearby donations
    const {
        data: donationsResponse,
        isLoading: isDonationsLoading,
        error: donationsError,
        refetch: refetchDonations,
    } = useQuery({
        queryKey: [
            "donations",
            "nearby",
            effectiveCoordinates.latitude,
            effectiveCoordinates.longitude,
            radius,
        ],
        queryFn: async () => {
            console.log('🔍 [NearbyDonations] Fetching with coords:', {
                latitude: effectiveCoordinates.latitude,
                longitude: effectiveCoordinates.longitude,
                radius,
                source: hasProfileLocation && !useGpsOverride ? 'profile' : 'gps',
            });

            try {
                const response = await api.donations.nearby(
                    effectiveCoordinates.latitude,
                    effectiveCoordinates.longitude,
                    radius
                );

                console.log('🔍 [NearbyDonations] Raw API Response:', response);

                // Defensive unwrapping - the API returns ApiResponse<Donation[]>
                // response.data should be the Donation[] array

                if (!response) {
                    console.warn('⚠️ [NearbyDonations] Response is null/undefined');
                    return [];
                }

                // The standard response shape is { data: Donation[], status: number, message?: string }
                const donations = response.data;

                if (!donations) {
                    console.warn('⚠️ [NearbyDonations] response.data is null/undefined');
                    return [];
                }

                if (!Array.isArray(donations)) {
                    // Handle case where backend returns different structure
                    console.warn('⚠️ [NearbyDonations] response.data is not an array:', donations);
                    // Check if it's a wrapped response like { data: [...] }
                    const nested = (donations as unknown as { data?: Donation[] }).data;
                    if (nested && Array.isArray(nested)) {
                        console.log('✅ [NearbyDonations] Found nested data array, count:', nested.length);
                        return nested;
                    }
                    return [];
                }

                console.log('✅ [NearbyDonations] Parsed donations count:', donations.length);
                return donations;
            } catch (err) {
                throw err;
            }
        },
        // Don't fetch while still locating (unless we have profile location)
        enabled: hasProfileLocation || !isLocating,
        staleTime: 30000, // Cache for 30 seconds
        refetchOnWindowFocus: false,
    });

    // Process donations with distance calculation and sorting
    const sortedDonations = useMemo((): DonationWithDistance[] => {
        if (!donationsResponse) return [];

        return donationsResponse
            .map((donation) => ({
                ...donation,
                distance: calculateDistance(effectiveCoordinates, {
                    latitude: donation.latitude,
                    longitude: donation.longitude,
                }),
            }))
            .sort((a, b) => a.distance - b.distance); // Sort by nearest first
    }, [donationsResponse, effectiveCoordinates]);

    // Handle donation click
    const handleDonationClick = useCallback(
        (donation: Donation) => {
            router.push(`/donations/${donation.id}`);
        },
        [router]
    );

    // Handle refresh all
    const handleRefreshAll = useCallback(async () => {
        await refreshLocation();
        refetchDonations();
    }, [refreshLocation, refetchDonations]);

    // Handle radius change
    const handleRadiusChange = useCallback((newRadius: number) => {
        setRadius(newRadius);
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nearby Donations</h1>
                    <p className="text-muted-foreground">
                        Find available food donations in your area
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefreshAll}
                    disabled={isLocating || isDonationsLoading}
                    className="gap-2"
                >
                    <RefreshCcw
                        className={`h-4 w-4 ${isLocating || isDonationsLoading ? "animate-spin" : ""
                            }`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Location Status */}
            <LocationStatus
                isDefault={isUsingDefault}
                isLoading={isLocating && !hasProfileLocation}
                error={locationError}
                onRefresh={refreshLocation}
                hasProfileLocation={hasProfileLocation && !useGpsOverride}
            />

            {/* Prompt to register location if not set */}
            {!hasProfileLocation && !isLocating && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <MapPin className="h-8 w-8 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                Register your location for better results
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Set your default location in your profile to see donations near you every time.
                            </p>
                        </div>
                        <Button asChild className="shrink-0 bg-blue-600 hover:bg-blue-700">
                            <Link href="/profile">Edit Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Controls Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <RadiusSelector value={radius} onChange={handleRadiusChange} />
                <div className="w-full sm:w-auto sm:min-w-50">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Error State */}
            {donationsError && (
                <Card className="border-destructive">
                    <CardContent className="p-4 flex items-center gap-3 text-destructive">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium">Failed to load donations</p>
                            <p className="text-sm opacity-80 truncate">
                                {(donationsError as Error).message || "Please try again later."}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchDonations()}
                            className="shrink-0"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {viewMode === "map" ? (
                    <motion.div
                        key="map-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <CardHeader className="py-3 px-4 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <MapIcon className="h-4 w-4" />
                                        {isDonationsLoading
                                            ? "Loading..."
                                            : `${sortedDonations.length} donation${sortedDonations.length !== 1 ? "s" : ""
                                            } within ${radius}km`}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DonationMap
                                    donations={sortedDonations}
                                    userLocation={effectiveCoordinates}
                                    height="500px"
                                    onDonationClick={handleDonationClick}
                                    showDistance={true}
                                    autoFitBounds={true}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DonationListView
                            donations={sortedDonations}
                            isLoading={isDonationsLoading}
                            onDonationClick={handleDonationClick}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Footer */}
            {!isDonationsLoading && sortedDonations.length > 0 && (
                <Card className="bg-muted/30">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {sortedDonations.length}
                                </p>
                                <p className="text-xs text-muted-foreground">Available</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {sortedDonations.length > 0 && sortedDonations[0]
                                        ? formatDistance(sortedDonations[0].distance)
                                        : "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">Nearest</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {sortedDonations.reduce((sum, d) => sum + d.quantity, 0)}kg
                                </p>
                                <p className="text-xs text-muted-foreground">Total Food</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">{radius}km</p>
                                <p className="text-xs text-muted-foreground">Search Radius</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
