/**
 * Map Components Barrel Export
 * 
 * NOTE: These components must be dynamically imported to avoid SSR issues.
 * The Leaflet library requires the `window` object which doesn't exist during SSR.
 * 
 * @example
 * ```tsx
 * import dynamic from 'next/dynamic';
 * import { DonationMapSkeleton, LocationPickerSkeleton } from '@/components/map';
 * 
 * const DonationMap = dynamic(
 *   () => import('@/components/map').then((mod) => mod.DonationMap),
 *   { ssr: false, loading: () => <DonationMapSkeleton /> }
 * );
 * 
 * const LocationPicker = dynamic(
 *   () => import('@/components/map').then((mod) => mod.LocationPicker),
 *   { ssr: false, loading: () => <LocationPickerSkeleton /> }
 * );
 * ```
 */

// Main map components (require dynamic import with ssr: false)
export { DonationMap } from "./DonationMap";
export { LocationPicker } from "./LocationPicker";

// Skeleton loaders (safe to import directly)
export { MapSkeleton, DonationMapSkeleton, LocationPickerSkeleton } from "./MapSkeleton";

// Type exports
export type { DonationMapProps, DonationMarker } from "./DonationMap";
export type { LocationPickerProps } from "./LocationPicker";
