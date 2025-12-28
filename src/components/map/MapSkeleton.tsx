"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MapSkeletonProps {
    height?: string;
    className?: string;
    showControls?: boolean;
}

/**
 * MapSkeleton - Loading placeholder for map components
 * Used during dynamic import loading states
 */
export function MapSkeleton({
    height = "400px",
    className,
    showControls = true,
}: MapSkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {showControls && (
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-32" />
                </div>
            )}
            <div
                className="relative rounded-lg overflow-hidden bg-muted animate-pulse"
                style={{ height }}
            >
                {/* Map placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                            <svg
                                className="w-6 h-6 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>
                        <span className="text-sm">Loading map...</span>
                    </div>
                </div>

                {/* Fake map grid lines */}
                <div className="absolute inset-0 opacity-10">
                    <div className="grid grid-cols-4 grid-rows-4 h-full">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="border border-muted-foreground/30" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * LocationPickerSkeleton - Specific skeleton for LocationPicker
 */
export function LocationPickerSkeleton({ height = "300px" }: { height?: string }) {
    return <MapSkeleton height={height} showControls={true} />;
}

/**
 * DonationMapSkeleton - Specific skeleton for DonationMap
 */
export function DonationMapSkeleton({ height = "400px" }: { height?: string }) {
    return <MapSkeleton height={height} showControls={false} />;
}

export default MapSkeleton;
