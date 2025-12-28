"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { GeoCoordinates } from "@/hooks/useGeolocation";
import { calculateDistance, formatDistance } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";
import type { Donation } from "@/types/donation";

// =============================================================================
// CONSTANTS
// =============================================================================

const TILE_URL =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const DEFAULT_ZOOM = 13;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DonationMapProps {
    donations: Donation[];
    userLocation?: GeoCoordinates | null;
    center?: GeoCoordinates;
    zoom?: number;
    height?: string;
    className?: string;
    onDonationClick?: (donation: Donation) => void;
    autoFitBounds?: boolean;
    showDistance?: boolean;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface MapControllerProps {
    donations: Donation[];
    userLocation?: GeoCoordinates | null;
    autoFitBounds: boolean;
    center?: GeoCoordinates;
}

function MapController({
    donations,
    userLocation,
    autoFitBounds,
    center,
}: MapControllerProps) {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (!autoFitBounds || hasFittedRef.current) return;

        const points: [number, number][] = [];

        if (userLocation) {
            points.push([userLocation.latitude, userLocation.longitude]);
        }

        donations.forEach((d) => {
            if (d.latitude && d.longitude) {
                points.push([d.latitude, d.longitude]);
            }
        });

        if (points.length > 1) {
            const bounds = points.map(([lat, lng]) => [lat, lng] as [number, number]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFittedRef.current = true;
        } else if (points.length === 1 && points[0]) {
            map.setView(points[0], DEFAULT_ZOOM);
            hasFittedRef.current = true;
        }
    }, [map, donations, userLocation, autoFitBounds]);

    useEffect(() => {
        if (center && !autoFitBounds) {
            map.setView([center.latitude, center.longitude], map.getZoom());
        }
    }, [map, center, autoFitBounds]);

    return null;
}

interface UserLocationMarkerProps {
    position: GeoCoordinates;
}

function UserLocationMarker({ position }: UserLocationMarkerProps) {
    const { userIcon } = useMapIcons();

    return (
        <Marker position={[position.latitude, position.longitude]} icon={userIcon}>
            <Popup>
                <div className="text-center">
                    <p className="font-semibold">Your Location</p>
                </div>
            </Popup>
        </Marker>
    );
}

interface DonationMarkerItemProps {
    donation: Donation;
    userLocation?: GeoCoordinates | null;
    showDistance: boolean;
    onClick?: (donation: Donation) => void;
}

function DonationMarkerItem({
    donation,
    userLocation,
    showDistance,
    onClick,
}: DonationMarkerItemProps) {
    const { getStatusIcon } = useMapIcons();
    const icon = getStatusIcon(donation.status);

    const distance = useMemo(() => {
        if (!userLocation || !donation.latitude || !donation.longitude) return null;
        return calculateDistance(userLocation, {
            latitude: donation.latitude,
            longitude: donation.longitude,
        });
    }, [userLocation, donation.latitude, donation.longitude]);

    return (
        <Marker
            position={[donation.latitude, donation.longitude]}
            icon={icon}
            eventHandlers={{
                click: () => onClick?.(donation),
            }}
        >
            <Popup>
                <div className="min-w-50 space-y-2">
                    <h3 className="font-semibold text-sm">{donation.title}</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>📦 {donation.quantity}kg</p>
                        <p>🏷️ {donation.status}</p>
                        {showDistance && distance !== null && (
                            <p>📍 {formatDistance(distance)} away</p>
                        )}
                        <p>
                            ⏰ Expires: {" "}
                            {new Date(donation.expires_at).toLocaleDateString()}
                        </p>
                    </div>
                    {onClick && (
                        <button
                            onClick={() => onClick(donation)}
                            className="w-full mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
                        >
                            View Details
                        </button>
                    )}
                </div>
            </Popup>
        </Marker>
    );
}

// =============================================================================
// CUSTOM ICONS HOOK
// =============================================================================

function useMapIcons() {
    const icons = useMemo(() => {
        if (typeof window === "undefined") {
            return {
                userIcon: null,
                getStatusIcon: () => null,
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const L = require("leaflet");

        const userIcon = L.divIcon({
            className: "user-location-marker",
            html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        const createDonationIcon = (color: string, emoji: string) =>
            L.divIcon({
                className: "donation-marker",
                html: `
          <div class="flex items-center justify-center w-8 h-8 ${color} rounded-full shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-full">
            <span class="text-sm">${emoji}</span>
          </div>
        `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
            });

        const statusIcons: Record<string, ReturnType<typeof L.divIcon>> = {
            pending: createDonationIcon("bg-green-500", "🥗"),
            available: createDonationIcon("bg-green-500", "🥗"),
            claimed: createDonationIcon("bg-yellow-500", "📋"),
            picked_up: createDonationIcon("bg-blue-500", "🚗"),
            delivered: createDonationIcon("bg-gray-400", "✅"),
            expired: createDonationIcon("bg-red-500", "⏰"),
        };

        const defaultIcon = createDonationIcon("bg-green-500", "🍽️");

        return {
            userIcon,
            getStatusIcon: (status: string) =>
                statusIcons[status.toLowerCase()] || defaultIcon,
        };
    }, []);

    return icons;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DonationMapClient({
    donations,
    userLocation,
    center,
    zoom = DEFAULT_ZOOM,
    height = "400px",
    className,
    onDonationClick,
    autoFitBounds = true,
    showDistance = true,
}: DonationMapProps) {
    const mapCenter = useMemo((): [number, number] => {
        if (center) {
            return [center.latitude, center.longitude];
        }
        if (userLocation) {
            return [userLocation.latitude, userLocation.longitude];
        }
        if (donations.length > 0 && donations[0]) {
            return [donations[0].latitude, donations[0].longitude];
        }
        return [30.0444, 31.2357];
    }, [center, userLocation, donations]);

    const forceRemountKey = useMemo(() => {
        const donationSignature = donations
            .map((d) => `${d.id}:${d.latitude}:${d.longitude}`)
            .join("|");
        const userSignature = userLocation
            ? `${userLocation.latitude}:${userLocation.longitude}`
            : "no-user";
        return `map-${donationSignature}-${userSignature}-${autoFitBounds ? "fit" : "static"}`;
    }, [donations, userLocation, autoFitBounds]);

    return (
        <div className={cn("relative rounded-lg overflow-hidden", className)}>
            <MapContainer
                key={forceRemountKey}
                center={mapCenter}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                scrollWheelZoom
                style={{ height, width: "100%" }}
                className="z-0"
            >
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

                <MapController
                    donations={donations}
                    userLocation={userLocation}
                    autoFitBounds={autoFitBounds}
                    center={center}
                />

                {userLocation && <UserLocationMarker position={userLocation} />}

                {donations.map((donation) => (
                    <DonationMarkerItem
                        key={donation.id}
                        donation={donation}
                        userLocation={userLocation}
                        showDistance={showDistance}
                        onClick={onDonationClick}
                    />
                ))}
            </MapContainer>
        </div>
    );
}

export default DonationMapClient;
