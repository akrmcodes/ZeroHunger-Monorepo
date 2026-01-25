"use client";

/**
 * ProfileLocationMapContent - Browser-only map rendering component
 * 
 * This component contains the actual Leaflet map implementation.
 * It's ONLY loaded via dynamic import with ssr: false, guaranteeing
 * it will never run on the server.
 * 
 * DO NOT import this file directly - use ProfileLocationMap instead.
 */

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { applyLeafletIconFix } from "@/lib/leaflet-icon-fix";
import type { User } from "@/lib/api";

// Apply the icon fix - safe because this file only runs in browser
applyLeafletIconFix();

// =============================================================================
// Props
// =============================================================================

export interface ProfileLocationMapContentProps {
    user: User;
    className?: string;
}

// =============================================================================
// Component
// =============================================================================

export default function ProfileLocationMapContent({
    user,
}: ProfileLocationMapContentProps) {
    const hasLocation = user.latitude && user.longitude;

    if (!hasLocation) {
        return null;
    }

    const lat = Number(user.latitude);
    const lng = Number(user.longitude);

    return (
        <MapContainer
            key={`${lat}-${lng}`}
            center={[lat, lng]}
            zoom={13}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            className="h-full w-full"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} />
        </MapContainer>
    );
}
