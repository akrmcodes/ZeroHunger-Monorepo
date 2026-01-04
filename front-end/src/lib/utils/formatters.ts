/**
 * Centralized Formatters
 * ======================
 * SINGLE SOURCE OF TRUTH for all display formatting in the application.
 * 
 * WHY THIS EXISTS:
 * - API returns raw values (e.g., `cooked_meal`)
 * - UI needs human-readable labels (e.g., "Cooked Meal")
 * - Multiple components were duplicating this logic inconsistently
 * 
 * RULE: ALL formatting must go through these utilities.
 */

import { FoodType, FOOD_TYPE_LABELS, DonationStatus, DONATION_STATUS_LABELS } from "@/types/donation";

// =============================================================================
// FOOD TYPE FORMATTER
// =============================================================================

/**
 * Convert raw food_type value from API to human-readable label.
 * 
 * Handles:
 * - Direct FoodType enum values (e.g., "cooked_meal")
 * - String variations (case insensitive)
 * - Unknown values (graceful fallback)
 * 
 * @example
 * formatFoodType("cooked_meal") // "Cooked Meal"
 * formatFoodType("COOKED_MEAL") // "Cooked Meal"  
 * formatFoodType(undefined)     // "Food"
 * formatFoodType("unknown_type") // "Unknown Type"
 */
export function formatFoodType(foodType: FoodType | string | null | undefined): string {
    if (!foodType) return "Food";

    // Normalize to lowercase for comparison
    const normalized = String(foodType).toLowerCase().trim();

    // Try direct lookup in FOOD_TYPE_LABELS (enum values are lowercase snake_case)
    if (normalized in FoodType) {
        const enumValue = normalized as FoodType;
        return FOOD_TYPE_LABELS[enumValue] ?? toTitleCase(normalized);
    }

    // Check if it matches any FoodType enum value
    const foodTypeValues = Object.values(FoodType) as string[];
    if (foodTypeValues.includes(normalized)) {
        return FOOD_TYPE_LABELS[normalized as FoodType] ?? toTitleCase(normalized);
    }

    // Fallback: Convert snake_case to Title Case
    return toTitleCase(normalized);
}

// =============================================================================
// DONATION STATUS FORMATTER  
// =============================================================================

/**
 * Convert raw status value from API to human-readable label.
 * 
 * @example
 * formatDonationStatus("pending")   // "Available"
 * formatDonationStatus("picked_up") // "Picked Up"
 */
export function formatDonationStatus(status: DonationStatus | string | null | undefined): string {
    if (!status) return "Unknown";

    const normalized = String(status).toLowerCase().trim();

    // Check if it's a valid DonationStatus
    const statusValues = Object.values(DonationStatus) as string[];
    if (statusValues.includes(normalized)) {
        return DONATION_STATUS_LABELS[normalized as DonationStatus] ?? toTitleCase(normalized);
    }

    // Fallback
    return toTitleCase(normalized);
}

// =============================================================================
// CLAIM STATUS FORMATTER
// =============================================================================

const CLAIM_STATUS_LABELS: Record<string, string> = {
    active: "Active",
    picked_up: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

/**
 * Convert raw claim status to human-readable label.
 */
export function formatClaimStatus(status: string | null | undefined): string {
    if (!status) return "Unknown";
    
    const normalized = String(status).toLowerCase().trim();
    return CLAIM_STATUS_LABELS[normalized] ?? toTitleCase(normalized);
}

// =============================================================================
// USER ROLE FORMATTER
// =============================================================================

const ROLE_LABELS: Record<string, string> = {
    donor: "Donor",
    volunteer: "Volunteer",
    recipient: "Recipient",
    admin: "Administrator",
};

/**
 * Convert raw role value to human-readable label.
 */
export function formatUserRole(role: string | null | undefined): string {
    if (!role) return "User";
    
    const normalized = String(role).toLowerCase().trim();
    return ROLE_LABELS[normalized] ?? toTitleCase(normalized);
}

// =============================================================================
// QUANTITY FORMATTER
// =============================================================================

/**
 * Format quantity with appropriate unit.
 * 
 * @example
 * formatQuantity(5)       // "5 kg"
 * formatQuantity(0.5)     // "0.5 kg"
 * formatQuantity(null)    // "N/A"
 */
export function formatQuantity(quantity: number | null | undefined, unit = "kg"): string {
    if (quantity == null) return "N/A";
    
    // Round to 1 decimal place if needed
    const rounded = Math.round(quantity * 10) / 10;
    return `${rounded} ${unit}`;
}

// =============================================================================
// DISTANCE FORMATTER
// =============================================================================

/**
 * Format distance in km or m depending on value.
 * 
 * @example
 * formatDistance(2.5)   // "2.5 km"
 * formatDistance(0.3)   // "300 m"
 * formatDistance(null)  // "Unknown"
 */
export function formatDistance(distanceKm: number | null | undefined): string {
    if (distanceKm == null) return "Unknown";
    
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    
    return `${Math.round(distanceKm * 10) / 10} km`;
}

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Convert snake_case or kebab-case to Title Case.
 * 
 * @example
 * toTitleCase("cooked_meal")  // "Cooked Meal"
 * toTitleCase("picked-up")    // "Picked Up"
 */
export function toTitleCase(str: string): string {
    return str
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate text with ellipsis.
 * 
 * @example
 * truncate("Very long text here", 10) // "Very long..."
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
}
