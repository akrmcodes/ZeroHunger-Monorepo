/**
 * Donation Type Definitions
 * -------------------------
 * Matches Laravel backend donation model structure.
 * 
 * IMPORTANT EXPORTS:
 * - DonationStatus: String literal union (not enum at runtime)
 * - FoodType: String literal union for food categories
 * - All types are properly exported to avoid "Module has no exports" errors
 */

import type { User } from "@/lib/api";
import type { Claim } from "@/types/claim";

// Re-export Claim for convenience
export type { Claim } from "@/types/claim";

// =============================================================================
// DONATION STATUS
// =============================================================================

/**
 * Donation status values matching Laravel backend.
 * Using enum for type safety and value mapping.
 */
export enum DonationStatus {
  Pending = "pending",
  Claimed = "claimed",
  PickedUp = "picked_up",
  Delivered = "delivered",
  Expired = "expired",
  Cancelled = "cancelled",
}

/**
 * Type-safe status check helpers
 */
export const DONATION_STATUS = {
  PENDING: "pending" as const,
  CLAIMED: "claimed" as const,
  PICKED_UP: "picked_up" as const,
  DELIVERED: "delivered" as const,
  EXPIRED: "expired" as const,
  CANCELLED: "cancelled" as const,
} as const;

/**
 * Status labels for UI display
 */
export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  [DonationStatus.Pending]: "Available",
  [DonationStatus.Claimed]: "Claimed",
  [DonationStatus.PickedUp]: "Picked Up",
  [DonationStatus.Delivered]: "Delivered",
  [DonationStatus.Expired]: "Expired",
  [DonationStatus.Cancelled]: "Cancelled",
} as const;

// =============================================================================
// FOOD TYPE
// =============================================================================

/**
 * Food type categories matching Laravel backend.
 */
export enum FoodType {
  CookedMeal = "cooked_meal",
  Groceries = "groceries",
  Bakery = "bakery",
  Vegetables = "vegetables",
  Canned = "canned",
  Dairy = "dairy",
  Beverages = "beverages",
  Other = "other",
}

/**
 * Food type labels for UI display
 */
export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  [FoodType.CookedMeal]: "Cooked Meal",
  [FoodType.Groceries]: "Groceries",
  [FoodType.Bakery]: "Bakery",
  [FoodType.Vegetables]: "Vegetables",
  [FoodType.Canned]: "Canned Goods",
  [FoodType.Dairy]: "Dairy",
  [FoodType.Beverages]: "Beverages",
  [FoodType.Other]: "Other",
} as const;

// =============================================================================
// DONATION INTERFACE
// =============================================================================

/**
 * Donor information subset
 */
export interface DonorInfo {
  id: number;
  name: string;
  phone: string | null;
  email?: string;
}

/**
 * Main Donation interface matching Laravel backend response.
 */
export interface Donation {
  id: number;
  title: string;
  description: string | null;
  food_type?: FoodType | string;
  quantity: number;
  expires_at: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  status: DonationStatus | string;
  created_at: string;
  updated_at?: string;
  donor_id: number;
  donor?: User | DonorInfo;
  claim?: Claim | null;
  pickup_code?: string;
}

/**
 * Form data for creating/updating donations
 */
export interface DonationFormData {
  title: string;
  description?: string;
  food_type: FoodType | string;
  quantity: number;
  expires_at: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a donation is available for claiming
 * IMPORTANT: Backend may return "available" or "pending" - accept both
 */
export function isDonationAvailable(donation: Donation | null | undefined): boolean {
  if (!donation) return false;
  const status = String(donation.status).toLowerCase();
  // Accept both "pending" (frontend convention) and "available" (backend convention)
  return status === "pending" || status === "available" || status === DonationStatus.Pending;
}

/**
 * Check if a donation has been claimed (but not yet picked up/delivered)
 */
export function isDonationClaimed(donation: Donation | null | undefined): boolean {
  if (!donation) return false;
  const status = String(donation.status).toLowerCase();
  return status === "claimed" || status === DonationStatus.Claimed;
}

/**
 * Check if a donation is in an active workflow (claimed or being delivered)
 */
export function isDonationInProgress(donation: Donation | null | undefined): boolean {
  if (!donation) return false;
  const status = String(donation.status).toLowerCase();
  return ["claimed", "picked_up"].includes(status);
}

/**
 * Check if a donation workflow is complete
 */
export function isDonationComplete(donation: Donation | null | undefined): boolean {
  if (!donation) return false;
  const status = String(donation.status).toLowerCase();
  return status === "delivered" || status === DonationStatus.Delivered;
}

/**
 * Check if current user is the donation owner (donor)
 */
export function isDonationOwner(donation: Donation | null | undefined, userId: number | undefined): boolean {
  if (!donation || !userId) return false;
  return donation.donor_id === userId;
}

/**
 * Normalize status string to DonationStatus enum
 */
export function normalizeDonationStatus(status: string | DonationStatus): DonationStatus {
  const normalized = String(status).toLowerCase();
  switch (normalized) {
    case "pending":
      return DonationStatus.Pending;
    case "claimed":
      return DonationStatus.Claimed;
    case "picked_up":
      return DonationStatus.PickedUp;
    case "delivered":
      return DonationStatus.Delivered;
    case "expired":
      return DonationStatus.Expired;
    case "cancelled":
      return DonationStatus.Cancelled;
    default:
      return DonationStatus.Pending;
  }
}
