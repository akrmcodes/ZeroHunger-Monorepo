/**
 * Claim Type Definitions
 * ----------------------
 * Matches Laravel backend claim model structure.
 * 
 * IMPORTANT: The backend uses 'active' status for claimed/ongoing donations,
 * NOT 'pending'. This aligns with the api.ts Claim interface.
 */

import type { User } from "@/lib/api";

/**
 * Claim status values from Laravel backend.
 * - active: Donation has been claimed, awaiting pickup
 * - picked_up: Volunteer has picked up the donation
 * - delivered: Donation has been delivered to recipient
 * - cancelled: Claim was cancelled, donation is available again
 */
export type ClaimStatus = "active" | "picked_up" | "delivered" | "cancelled";

/**
 * Claim status labels for UI display
 */
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  active: "Claimed",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

/**
 * Claim status colors for UI styling
 */
export const CLAIM_STATUS_COLORS: Record<ClaimStatus, { bg: string; text: string }> = {
  active: { bg: "bg-blue-100", text: "text-blue-800" },
  picked_up: { bg: "bg-purple-100", text: "text-purple-800" },
  delivered: { bg: "bg-green-100", text: "text-green-800" },
  cancelled: { bg: "bg-neutral-100", text: "text-neutral-800" },
} as const;

/**
 * Volunteer information subset for claim display
 */
export interface ClaimVolunteer {
  id: number;
  name: string;
  phone: string | null;
}

/**
 * Claim interface matching Laravel backend response.
 * Aligned with api.ts Claim type to ensure consistency.
 */
export interface Claim {
  id: number;
  donation_id: number;
  volunteer_id: number;
  status: ClaimStatus;
  picked_up_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  volunteer?: ClaimVolunteer | User;
  created_at: string;
  updated_at?: string;
}

/**
 * Response structure when claiming a donation
 */
export interface ClaimDonationResult {
  message: string;
  pickup_code: string;
  claim?: Claim;
}

/**
 * Response structure for claim actions (pickup, deliver)
 */
export interface ClaimActionResult {
  message: string;
  claim: Claim;
}

/**
 * Helper to check if a claim is in an active/ongoing state
 */
export function isClaimActive(claim: Claim | null | undefined): boolean {
  if (!claim) return false;
  return claim.status === "active" || claim.status === "picked_up";
}

/**
 * Helper to check if a claim is completed
 */
export function isClaimCompleted(claim: Claim | null | undefined): boolean {
  if (!claim) return false;
  return claim.status === "delivered";
}

/**
 * Helper to check if user is the claim owner (volunteer)
 */
export function isClaimOwner(claim: Claim | null | undefined, userId: number | undefined): boolean {
  if (!claim || !userId) return false;
  return claim.volunteer_id === userId;
}
