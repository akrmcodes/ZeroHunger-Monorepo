/**
 * Profile Types
 * Type definitions for user profile management
 */

import { z } from "zod";

// =============================================================================
// DTOs
// =============================================================================

/**
 * Data Transfer Object for updating user profile
 */
export interface UpdateProfileDTO {
    name?: string;
    phone?: string;
    latitude?: number | null;
    longitude?: number | null;
}

/**
 * Profile completion status
 */
export interface ProfileCompletion {
    percentage: number;
    missingFields: string[];
    isComplete: boolean;
}

/**
 * User statistics for profile display
 */
export interface UserStats {
    donationsCreated: number;
    claimsFulfilled: number;
    totalKgSaved: number;
    impactScore: number;
}

// =============================================================================
// Zod Schemas
// =============================================================================

/**
 * Profile Form Schema
 * 
 * CRITICAL NOTES:
 * - phone: Can be empty string or valid phone. Using .optional().transform() for null handling.
 * - latitude/longitude: Must accept null from API and number from form input.
 *   Using .preprocess() to handle string-to-number coercion from form inputs.
 */
export const profileSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
    phone: z
        .string()
        .regex(/^[+]?[\d\s-()]{7,20}$/, "Please enter a valid phone number")
        .or(z.literal(""))
        .optional()
        .transform((val) => val || ""),
    latitude: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
        z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").nullable()
    ),
    longitude: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
        z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").nullable()
    ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// =============================================================================
// Role Display Helpers
// =============================================================================

export const ROLE_CONFIG = {
    donor: {
        label: "Donor",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "Heart",
        description: "Food hero saving meals from waste",
    },
    volunteer: {
        label: "Volunteer",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "Truck",
        description: "Delivery champion connecting donors to recipients",
    },
    recipient: {
        label: "Recipient",
        color: "bg-violet-100 text-violet-800 border-violet-200",
        icon: "Users",
        description: "Community partner fighting hunger",
    },
} as const;

export type UserRole = keyof typeof ROLE_CONFIG;

// =============================================================================
// Profile Completion Calculator
// =============================================================================

export function calculateProfileCompletion(user: {
    name?: string;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    avatar_url?: string | null;
}): ProfileCompletion {
    const hasName = Boolean(user.name && user.name.trim().length > 0);
    const hasPhone = Boolean(user.phone && String(user.phone).trim().length > 0);
    const hasLocation =
        user.latitude !== null &&
        user.latitude !== undefined &&
        user.longitude !== null &&
        user.longitude !== undefined;
    const hasAvatar = Boolean(user.avatar_url && user.avatar_url.trim().length > 0);

    const fields = [
        { key: "name", label: "Name", value: hasName },
        { key: "phone", label: "Phone number", value: hasPhone },
        { key: "location", label: "Location", value: hasLocation },
        { key: "avatar", label: "Avatar", value: hasAvatar },
    ];

    const completedFields = fields.filter((f) => f.value);
    const missingFields = fields.filter((f) => !f.value).map((f) => f.label);
    const percentage = Math.round((completedFields.length / fields.length) * 100);

    return {
        percentage,
        missingFields,
        isComplete: percentage === 100,
    };
}
