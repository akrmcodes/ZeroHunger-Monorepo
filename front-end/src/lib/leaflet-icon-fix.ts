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
 * IMPORTANT: This uses lazy initialization to prevent SSR issues.
 * Call `applyLeafletIconFix()` from within a dynamically imported component.
 * 
 * @example
 * ```tsx
 * // In a component that's dynamically imported with ssr: false
 * import { applyLeafletIconFix } from "@/lib/leaflet-icon-fix";
 * applyLeafletIconFix();
 * ```
 */

// Use CDN URLs for the marker icons (reliable and always available)
const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Singleton flag to prevent multiple initializations
let isFixed = false;

/**
 * Apply the Leaflet icon fix. This function is safe to call multiple times
 * and will only execute once. It also has a guard for SSR environments.
 * 
 * MUST be called from within a dynamically imported component with ssr: false
 * to guarantee it only runs in the browser.
 */
export function applyLeafletIconFix(): void {
    // Guard: Skip if already fixed or running on server
    if (isFixed || typeof window === "undefined") {
        return;
    }

    // Dynamic require to avoid module-level evaluation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

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

    isFixed = true;
}

// For backwards compatibility - but prefer applyLeafletIconFix()
export default applyLeafletIconFix;
