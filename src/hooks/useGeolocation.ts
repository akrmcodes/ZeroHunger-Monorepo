"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================================
// CONSTANTS - Fallback Location Strategy
// =============================================================================

/**
 * Default fallback location: Sana'a, Yemen city center
 * Used when GPS fails, times out, or permission is denied
 * Configurable via environment variables for different deployments
 */
const DEFAULT_LOCATION = {
  latitude: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LATITUDE || "15.3694"),
  longitude: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE || "44.1910"),
} as const;

/**
 * Maximum time (ms) to wait for GPS before forcing fallback
 * Critical for UX - prevents infinite loading states
 */
const GEOLOCATION_TIMEOUT_MS = 3000;

/**
 * Enable high accuracy mode for better precision
 * Trade-off: Slightly slower but more accurate
 */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: GEOLOCATION_TIMEOUT_MS,
  maximumAge: 60000, // Cache position for 1 minute
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  /** Current coordinates (user location OR fallback) */
  coordinates: GeoCoordinates;
  /** True while actively fetching location */
  isLoading: boolean;
  /** Error message if geolocation failed */
  error: string | null;
  /** True if using fallback/default location instead of GPS */
  isDefault: boolean;
  /** True if browser supports geolocation API */
  isSupported: boolean;
  /** Timestamp of last successful update */
  lastUpdated: Date | null;
}

export interface UseGeolocationOptions {
  /** Whether to automatically fetch location on mount */
  autoFetch?: boolean;
  /** Custom fallback coordinates (overrides default) */
  fallbackLocation?: GeoCoordinates;
  /** Custom timeout in milliseconds */
  timeout?: number;
  /** Callback when location is successfully fetched */
  onSuccess?: (coords: GeoCoordinates) => void;
  /** Callback when location fetch fails */
  onError?: (error: string) => void;
}

export interface UseGeolocationReturn extends GeolocationState {
  /** Manually refresh the user's location */
  refresh: () => Promise<void>;
  /** Force set coordinates manually (e.g., from map click) */
  setCoordinates: (coords: GeoCoordinates) => void;
  /** Reset to default/fallback location */
  resetToDefault: () => void;
}

// =============================================================================
// GEOLOCATION HOOK
// =============================================================================

/**
 * useGeolocation - Bulletproof geolocation hook with smart fallback
 * 
 * Features:
 * - 3-second timeout prevents stuck loading states
 * - Automatic fallback to city center if GPS fails
 * - SSR-safe with proper typeof checks
 * - Manual refresh and coordinate override support
 * - Comprehensive error handling for all failure modes
 * 
 * @example
 * ```tsx
 * const { coordinates, isLoading, isDefault, refresh } = useGeolocation();
 * 
 * // coordinates are ALWAYS available (never null)
 * // isDefault tells you if using fallback location
 * ```
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    autoFetch = true,
    fallbackLocation = DEFAULT_LOCATION,
    timeout = GEOLOCATION_TIMEOUT_MS,
    onSuccess,
    onError,
  } = options;

  // Track if component is mounted for async safety
  const isMountedRef = useRef(true);
  // Timeout reference for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Watch ID for cleanup
  const watchIdRef = useRef<number | null>(null);

  // Check browser support (SSR-safe)
  const isSupported = typeof window !== "undefined" && "geolocation" in navigator;

  // Initialize state with fallback - NEVER null coordinates
  const [state, setState] = useState<GeolocationState>({
    coordinates: fallbackLocation,
    isLoading: autoFetch && isSupported,
    error: null,
    isDefault: true,
    isSupported,
    lastUpdated: null,
  });

  /**
   * Handle successful position fetch
   */
  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      if (!isMountedRef.current) return;

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const newCoordinates: GeoCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setState((prev) => ({
        ...prev,
        coordinates: newCoordinates,
        isLoading: false,
        error: null,
        isDefault: false,
        lastUpdated: new Date(),
      }));

      onSuccess?.(newCoordinates);
    },
    [onSuccess]
  );

  /**
   * Handle position fetch error
   */
  const handleError = useCallback(
    (error: GeolocationPositionError | string) => {
      if (!isMountedRef.current) return;

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const errorMessage =
        typeof error === "string"
          ? error
          : getGeolocationErrorMessage(error.code);

      setState((prev) => ({
        ...prev,
        // Keep coordinates at fallback - NEVER leave user without location
        coordinates: fallbackLocation,
        isLoading: false,
        error: errorMessage,
        isDefault: true,
        lastUpdated: new Date(),
      }));

      onError?.(errorMessage);
    },
    [fallbackLocation, onError]
  );

  /**
   * Force fallback after timeout - The "Demo Effect" prevention
   * This ensures the map NEVER shows a blank screen
   */
  const forceTimeoutFallback = useCallback(() => {
    if (!isMountedRef.current) return;

    console.warn(
      `[useGeolocation] GPS timed out after ${timeout}ms, using fallback location`
    );

    setState((prev) => ({
      ...prev,
      coordinates: fallbackLocation,
      isLoading: false,
      error: "Location request timed out. Using default location.",
      isDefault: true,
      lastUpdated: new Date(),
    }));

    onError?.("Location request timed out");
  }, [fallbackLocation, timeout, onError]);

  /**
   * Fetch current position with timeout protection
   */
  const fetchPosition = useCallback(async (): Promise<void> => {
    // SSR guard
    if (typeof window === "undefined" || !navigator?.geolocation) {
      handleError("Geolocation is not supported by this browser");
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Set up force-fallback timeout
    // This is the "bulletproof" protection against GPS hanging
    timeoutRef.current = setTimeout(() => {
      forceTimeoutFallback();
    }, timeout);

    // Request position
    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        {
          ...GEOLOCATION_OPTIONS,
          timeout,
        }
      );
    } catch {
      handleError("Failed to request location");
    }
  }, [handleSuccess, handleError, forceTimeoutFallback, timeout]);

  /**
   * Manually set coordinates (e.g., from map click)
   */
  const setCoordinates = useCallback((coords: GeoCoordinates) => {
    setState((prev) => ({
      ...prev,
      coordinates: coords,
      isDefault: false,
      error: null,
      lastUpdated: new Date(),
    }));
  }, []);

  /**
   * Reset to default/fallback location
   */
  const resetToDefault = useCallback(() => {
    setState((prev) => ({
      ...prev,
      coordinates: fallbackLocation,
      isDefault: true,
      error: null,
      lastUpdated: new Date(),
    }));
  }, [fallbackLocation]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    isMountedRef.current = true;
    const currentTimeoutRef = timeoutRef.current;
    const currentWatchId = watchIdRef.current;

    if (autoFetch && isSupported) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          fetchPosition();
        }
      });
    } else if (!isSupported) {
      // Immediately set fallback if not supported
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Geolocation is not supported by this browser",
            isDefault: true,
          }));
        }
      });
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }

      if (currentWatchId !== null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(currentWatchId);
      }
    };
  }, [autoFetch, isSupported, fetchPosition]);

  return {
    ...state,
    refresh: fetchPosition,
    setCoordinates,
    resetToDefault,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert GeolocationPositionError code to human-readable message
 */
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return "Location permission denied. Please enable location access in your browser settings.";
    case 2: // POSITION_UNAVAILABLE
      return "Unable to determine your location. Using default location.";
    case 3: // TIMEOUT
      return "Location request timed out. Using default location.";
    default:
      return "An unknown error occurred while fetching location.";
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  from: GeoCoordinates,
  to: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

// Re-export types for convenience
export { DEFAULT_LOCATION };
