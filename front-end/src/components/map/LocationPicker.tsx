"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, Navigation, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGeolocation, DEFAULT_LOCATION } from "@/hooks/useGeolocation";
import type { GeoCoordinates } from "@/hooks/useGeolocation";

// =============================================================================
// CONSTANTS
// =============================================================================

const TILE_URL =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const DEFAULT_ZOOM = 15;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LocationPickerProps {
    /** Current latitude value */
    latitude?: number | null;
    /** Current longitude value */
    longitude?: number | null;
    /** Called when location changes */
    onLocationChange: (coords: GeoCoordinates) => void;
    /** Called when address text changes (optional) */
    onAddressChange?: (address: string) => void;
    /** Map container height */
    height?: string;
    /** Additional CSS classes */
    className?: string;
    /** Placeholder text for instructions */
    placeholder?: string;
    /** Disable user interaction */
    disabled?: boolean;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * ClickHandler - Listens for map clicks and updates location
 */
interface ClickHandlerProps {
    onLocationSelect: (coords: GeoCoordinates) => void;
    disabled?: boolean;
}

function ClickHandler({ onLocationSelect, disabled }: ClickHandlerProps) {
    useMapEvents({
        click: (e) => {
            if (disabled) return;
            onLocationSelect({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
            });
        },
    });
    return null;
}

/**
 * MapCenterUpdater - Syncs map center with external state
 */
interface MapCenterUpdaterProps {
    center: [number, number];
}

function MapCenterUpdater({ center }: MapCenterUpdaterProps) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom(), { animate: true });
    }, [map, center]);

    return null;
}

/**
 * DraggableMarker - Pin that user can drag to set location
 */
interface DraggableMarkerProps {
    position: [number, number];
    onPositionChange: (coords: GeoCoordinates) => void;
    disabled?: boolean;
}

function DraggableMarker({
    position,
    onPositionChange,
    disabled,
}: DraggableMarkerProps) {
    const { markerIcon } = usePickerIcons();

    return (
        <Marker
            position={position}
            icon={markerIcon}
            draggable={!disabled}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    onPositionChange({
                        latitude: pos.lat,
                        longitude: pos.lng,
                    });
                },
            }}
        />
    );
}

// =============================================================================
// CUSTOM ICONS HOOK
// =============================================================================

function usePickerIcons() {
    const icons = useMemo(() => {
        if (typeof window === "undefined") {
            return { markerIcon: null };
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const L = require("leaflet");

        const markerIcon = L.divIcon({
            className: "location-picker-marker",
            html: `
        <div class="relative">
          <div class="absolute -top-8 -left-3 w-6 h-8">
            <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-lg">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#16a34a"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
          </div>
          <div class="absolute -top-1 -left-1 w-2 h-2 bg-green-600 rounded-full border border-white shadow"></div>
        </div>
      `,
            iconSize: [24, 32],
            iconAnchor: [12, 32],
        });

        return { markerIcon };
    }, []);

    return icons;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * LocationPicker - Interactive map for selecting a location
 * 
 * Features:
 * - Click to set location
 * - Drag marker to adjust
 * - "Use My Location" button
 * - Bidirectional state sync with parent form
 * - Coordinate display
 * 
 * @example
 * ```tsx
 * <LocationPicker
 *   latitude={form.watch("latitude")}
 *   longitude={form.watch("longitude")}
 *   onLocationChange={(coords) => {
 *     form.setValue("latitude", coords.latitude);
 *     form.setValue("longitude", coords.longitude);
 *   }}
 * />
 * ```
 */
export function LocationPicker({
    latitude,
    longitude,
    onLocationChange,
    onAddressChange,
    height = "300px",
    className,
    placeholder = "Click on the map or drag the marker to set pickup location",
    disabled = false,
}: LocationPickerProps) {
    // Parse incoming values defensively (may arrive as string/null)
    const latVal = latitude === null || latitude === undefined ? NaN : Number(latitude);
    const lngVal = longitude === null || longitude === undefined ? NaN : Number(longitude);
    const hasValidCoords = Number.isFinite(latVal) && Number.isFinite(lngVal);

    // Track if a location has been explicitly selected
    const [hasSelection, setHasSelection] = useState(hasValidCoords);

    // Map center (only for initial view)
    const defaultCenter: [number, number] = hasValidCoords 
        ? [latVal, lngVal] 
        : [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
    const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

    // Use the geolocation hook for "Use My Location" functionality
    // When user clicks "Use My Location", we fetch fresh coordinates via onSuccess callback
    const {
        isLoading: isLocating,
        refresh: refreshLocation,
    } = useGeolocation({ 
        autoFetch: false,
        onSuccess: (freshCoords) => {
            // This callback fires with FRESH coordinates after GPS fetch succeeds
            // Use these immediately to avoid stale closure issues
            if (!disabled) {
                setHasSelection(true);
                onLocationChange(freshCoords);
                setMapCenter([freshCoords.latitude, freshCoords.longitude]);
                
                // Generate address text from fresh coordinates
                const addressText = `Lat: ${freshCoords.latitude.toFixed(6)}, Long: ${freshCoords.longitude.toFixed(6)}`;
                onAddressChange?.(addressText);
            }
        },
    });

    // Current marker position
    const markerPosition = useMemo((): [number, number] => {
        if (hasValidCoords) {
            return [latVal, lngVal];
        }
        // Default to default location
        return [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
    }, [hasValidCoords, latVal, lngVal]);

    // Handle location selection (click or drag)
    const handleLocationSelect = useCallback(
        (coords: GeoCoordinates) => {
            if (disabled) return;

            setHasSelection(true);
            onLocationChange(coords);

            // Generate a simple address string from coordinates
            const addressText = `Lat: ${coords.latitude.toFixed(6)}, Long: ${coords.longitude.toFixed(6)}`;
            onAddressChange?.(addressText);
        },
        [disabled, onLocationChange, onAddressChange]
    );

    // Handle "Use My Location" button - just trigger refresh
    // The actual coordinate handling happens in the onSuccess callback above
    const handleUseMyLocation = useCallback(async () => {
        if (disabled) return;
        await refreshLocation();
    }, [disabled, refreshLocation]);

    // Handle reset
    const handleReset = useCallback(() => {
        setHasSelection(false);
        onLocationChange({
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
        });
        setMapCenter([DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude]);
    }, [onLocationChange]);

    // Sync with external changes - use derived state pattern
    // Note: This is intentional as we're syncing with external props
    const shouldHaveSelection = hasValidCoords;
    if (shouldHaveSelection !== hasSelection && shouldHaveSelection) {
        setHasSelection(true);
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">{placeholder}</p>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={disabled || isLocating}
                        className="gap-1.5"
                    >
                        <Navigation className="h-4 w-4" />
                        {isLocating ? "Locating..." : "Use My Location"}
                    </Button>
                    {hasSelection && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={disabled}
                            className="gap-1.5"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Map */}
            <div
                className={cn(
                    "relative rounded-lg overflow-hidden border",
                    disabled && "opacity-60 pointer-events-none"
                )}
            >
                <MapContainer
                    center={mapCenter}
                    zoom={DEFAULT_ZOOM}
                    scrollWheelZoom={true}
                    style={{ height, width: "100%" }}
                    className="z-0"
                >
                    <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

                    {/* Click handler */}
                    <ClickHandler
                        onLocationSelect={handleLocationSelect}
                        disabled={disabled}
                    />

                    {/* Center updater for "Use My Location" */}
                    <MapCenterUpdater center={mapCenter} />

                    {/* Draggable marker */}
                    {hasSelection && (
                        <DraggableMarker
                            position={markerPosition}
                            onPositionChange={handleLocationSelect}
                            disabled={disabled}
                        />
                    )}
                </MapContainer>

                {/* Crosshair overlay when no selection */}
                {!hasSelection && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <MapPin className="h-8 w-8 animate-bounce" />
                            <span className="text-xs bg-background/80 px-2 py-1 rounded">
                                Click to place marker
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Coordinate display */}
            {hasSelection && hasValidCoords ? (
                <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Selected Location:
                    </span>
                    <span>Lat: {latVal.toFixed(6)}</span>
                    <span>Long: {lngVal.toFixed(6)}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    <MapPin className="h-3 w-3" />
                    <span>No location selected</span>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// DYNAMIC IMPORT WRAPPER
// =============================================================================

/**
 * This file should be imported dynamically to avoid SSR issues:
 * 
 * ```tsx
 * import dynamic from 'next/dynamic';
 * 
 * const LocationPicker = dynamic(
 *   () => import('@/components/map/LocationPicker').then((mod) => mod.LocationPicker),
 *   { ssr: false, loading: () => <LocationPickerSkeleton /> }
 * );
 * ```
 */

export default LocationPicker;
