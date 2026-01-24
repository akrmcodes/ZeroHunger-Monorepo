"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
// نستخدم الاستيراد الديناميكي للمكونات الداخلية لتقليل حجم الباقة الأولية
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
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange: (coords: GeoCoordinates) => void;
    onAddressChange?: (address: string) => void;
    height?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

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
            return { markerIcon: undefined };
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
    // ✅ FIX: State to track if we are on the client (browser)
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const latVal = latitude === null || latitude === undefined ? NaN : Number(latitude);
    const lngVal = longitude === null || longitude === undefined ? NaN : Number(longitude);
    const hasValidCoords = Number.isFinite(latVal) && Number.isFinite(lngVal);

    const [hasSelection, setHasSelection] = useState(hasValidCoords);

    const defaultCenter: [number, number] = hasValidCoords
        ? [latVal, lngVal]
        : [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
    const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

    const {
        isLoading: isLocating,
        refresh: refreshLocation,
    } = useGeolocation({
        autoFetch: false,
        onSuccess: (freshCoords) => {
            if (!disabled) {
                setHasSelection(true);
                onLocationChange(freshCoords);
                setMapCenter([freshCoords.latitude, freshCoords.longitude]);
                const addressText = `Lat: ${freshCoords.latitude.toFixed(6)}, Long: ${freshCoords.longitude.toFixed(6)}`;
                onAddressChange?.(addressText);
            }
        },
    });

    const markerPosition = useMemo((): [number, number] => {
        if (hasValidCoords) {
            return [latVal, lngVal];
        }
        return [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
    }, [hasValidCoords, latVal, lngVal]);

    const handleLocationSelect = useCallback(
        (coords: GeoCoordinates) => {
            if (disabled) return;
            setHasSelection(true);
            onLocationChange(coords);
            const addressText = `Lat: ${coords.latitude.toFixed(6)}, Long: ${coords.longitude.toFixed(6)}`;
            onAddressChange?.(addressText);
        },
        [disabled, onLocationChange, onAddressChange]
    );

    const handleUseMyLocation = useCallback(async () => {
        if (disabled) return;
        await refreshLocation();
    }, [disabled, refreshLocation]);

    const handleReset = useCallback(() => {
        setHasSelection(false);
        onLocationChange({
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
        });
        setMapCenter([DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude]);
    }, [onLocationChange]);

    const shouldHaveSelection = hasValidCoords;
    if (shouldHaveSelection !== hasSelection && shouldHaveSelection) {
        setHasSelection(true);
    }

    // ✅ FIX: If not mounted (Server Side), return a Skeleton/Loading div
    // This prevents "window is not defined" because MapContainer is never rendered on server
    if (!isMounted) {
        return (
            <div 
                className={cn("w-full bg-slate-100 animate-pulse rounded-lg border border-slate-200", className)} 
                style={{ height }}
            >
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <MapPin className="h-8 w-8 opacity-20" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
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
                    <ClickHandler
                        onLocationSelect={handleLocationSelect}
                        disabled={disabled}
                    />
                    <MapCenterUpdater center={mapCenter} />
                    {hasSelection && (
                        <DraggableMarker
                            position={markerPosition}
                            onPositionChange={handleLocationSelect}
                            disabled={disabled}
                        />
                    )}
                </MapContainer>

                {!hasSelection && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <MapPin className="h-8 w-8 animate-bounce" />
                            <span className="text-xs bg-background/80 px-2 py-1 rounded">
                                Click to place marker
                            </span>
                        </div>
                    </div>
                )}
            </div>

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

// ✅ FIX: Export Default as well for compatibility
export default LocationPicker;