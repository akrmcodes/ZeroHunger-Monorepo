"use client";

/**
 * ProfileLocationMap - SSR-Safe Map Wrapper
 * 
 * This component provides a bulletproof SSR-safe wrapper around the Leaflet map.
 * It uses Next.js dynamic imports with ssr: false to guarantee the map code
 * never executes on the server.
 * 
 * Usage:
 * ```tsx
 * import { ProfileLocationMap } from "./ProfileLocationMap";
 * 
 * <ProfileLocationMap user={user} />
 * ```
 */

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/api";

// =============================================================================
// Dynamic Import with SSR Disabled
// =============================================================================

const ProfileLocationMapContent = dynamic(
    () => import("./ProfileLocationMapContent"),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full items-center justify-center bg-slate-100">
                <Skeleton className="h-full w-full" />
            </div>
        ),
    }
);

// =============================================================================
// Props
// =============================================================================

export interface ProfileLocationMapProps {
    user: User;
    className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ProfileLocationMap({ user, className }: ProfileLocationMapProps) {
    const hasLocation = user.latitude && user.longitude;

    // If no location, show placeholder (no need to load map)
    if (!hasLocation) {
        return (
            <div className="flex h-40 flex-col items-center justify-center bg-slate-50 text-center p-4">
                <MapPin className="mb-2 size-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                    No location set
                </p>
                <p className="text-xs text-slate-400">
                    Edit your profile to add a location
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            <ProfileLocationMapContent user={user} />
        </div>
    );
}

export default ProfileLocationMap;
