/**
 * Claim Validation Schemas
 * ------------------------
 * Zod schemas for claim-related form validation.
 * Matches Laravel backend validation rules.
 */

import { z } from "zod";

// =============================================================================
// PICKUP CODE VALIDATION
// =============================================================================

/**
 * Pickup code format: 6 digits (numeric only)
 * Backend generates codes like "123456" from claim IDs
 */
export const PICKUP_CODE_REGEX = /^\d{6}$/;
export const PICKUP_CODE_LENGTH = 6;

/**
 * Pickup code schema for verifying donation pickup
 */
export const pickupCodeSchema = z.object({
  pickup_code: z
    .string()
    .length(PICKUP_CODE_LENGTH, {
      message: `Pickup code must be exactly ${PICKUP_CODE_LENGTH} digits`,
    })
    .regex(PICKUP_CODE_REGEX, {
      message: "Pickup code must contain only numbers",
    })
    .transform((val) => val.trim()),
});

export type PickupCodeFormValues = z.infer<typeof pickupCodeSchema>;

// =============================================================================
// DELIVERY NOTES VALIDATION
// =============================================================================

/**
 * Maximum length for delivery notes
 */
export const DELIVERY_NOTES_MAX_LENGTH = 500;

/**
 * Delivery confirmation schema
 */
export const deliverySchema = z.object({
  notes: z
    .string()
    .max(DELIVERY_NOTES_MAX_LENGTH, {
      message: `Notes cannot exceed ${DELIVERY_NOTES_MAX_LENGTH} characters`,
    })
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;

// =============================================================================
// CLAIM CANCELLATION VALIDATION
// =============================================================================

/**
 * Cancellation confirmation schema (with optional reason)
 */
export const cancelClaimSchema = z.object({
  reason: z
    .string()
    .max(250, {
      message: "Reason cannot exceed 250 characters",
    })
    .optional()
    .transform((val) => val?.trim() || undefined),
  confirmed: z.literal(true).describe("Please confirm the cancellation"),
});

export type CancelClaimFormValues = z.infer<typeof cancelClaimSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate pickup code format without full schema
 */
export function isValidPickupCode(code: string): boolean {
  return PICKUP_CODE_REGEX.test(code);
}

/**
 * Format pickup code for display (add spaces for readability)
 */
export function formatPickupCode(code: string): string {
  const cleaned = code.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

/**
 * Clean pickup code for submission (remove non-digits)
 */
export function cleanPickupCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, 6);
}
