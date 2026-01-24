"use client";

/**
 * Leaflet Icon Fix for Next.js / Webpack
 * 
 * Problem: Leaflet's default marker icons don't load in Next.js because
 * webpack changes the image paths. This causes 404 errors for:
 * - marker-icon.png
 * - marker-icon-2x.png
 * - marker-shadow.png
 *
 * Solution: Manually configure the default icon using CDN paths.
 * 
 * Usage: Import this file in any component that uses Leaflet Markers
 * ```tsx
 * import "@/lib/leaflet-icon-fix";
 * ```
 */

import L from "leaflet";

// Use CDN URLs for the marker icons (reliable and always available)
const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Fix the default icon - delete the broken _getIconUrl method
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: MARKER_ICON_URL,
    iconRetinaUrl: MARKER_ICON_2X_URL,
    shadowUrl: MARKER_SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export { };
