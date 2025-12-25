"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hand, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ClaimSuccessDialog } from "@/components/donations/claim/ClaimSuccessDialog";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import type { Donation } from "@/types/donation";
import { cn } from "@/lib/utils";

interface ClaimButtonProps {
    /** The donation to claim */
    donation: Donation;
    /** Optional callback after successful claim */
    onClaimSuccess?: (pickupCode: string) => void;
    /** Optional: Disable the button */
    disabled?: boolean;
    /** Button variant */
    variant?: "default" | "outline" | "ghost";
    /** Button size */
    size?: "default" | "sm" | "lg" | "icon";
    /** Additional class names */
    className?: string;
    /** Show full button text or icon only */
    compact?: boolean;
}

// Button animation variants
const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
};

export function ClaimButton({
    donation,
    onClaimSuccess,
    disabled = false,
    variant = "default",
    size = "default",
    className,
    compact = false,
}: ClaimButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [pickupCode, setPickupCode] = useState<string>("");

    /**
     * Handle claim action with proper error handling
     * - 409 Conflict: Donation already claimed
     * - Other errors: Generic error toast
     */
    const handleClaim = useCallback(async () => {
        if (isLoading || disabled) return;

        setIsLoading(true);

        try {
            const response = await api.donations.claim(donation.id);

            // Safely extract pickup code from response
            // Response structure: { data: { message, donation, pickup_code } }
            let code = "";

            // Handle nested data structure from Laravel
            const responseData = response.data as {
                pickup_code?: string;
                data?: { pickup_code?: string };
            };

            if (responseData.pickup_code) {
                code = responseData.pickup_code;
            } else if (responseData.data?.pickup_code) {
                code = responseData.data.pickup_code;
            } else {
                // Fallback: generate code from donation ID
                code = String(donation.id).padStart(6, "0");
            }

            setPickupCode(code);
            setShowSuccessDialog(true);

            // Notify parent if callback provided
            onClaimSuccess?.(code);

            toast.success("Donation claimed successfully!", {
                description: "Check your claims to view pickup details.",
            });
        } catch (error) {
            const apiError = error as ApiError;
            const status = apiError?.status ?? 0;

            if (status === 409) {
                // Donation already claimed by someone else
                toast.error("Already Claimed", {
                    description: "This donation was just claimed by another volunteer. Please try a different one.",
                    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
                });
                // Refresh the page to show updated status
                router.refresh();
            } else if (status === 403) {
                toast.error("Permission Denied", {
                    description: "You don't have permission to claim donations. Make sure you're registered as a volunteer.",
                });
            } else if (status === 404) {
                toast.error("Donation Not Found", {
                    description: "This donation may have been removed or expired.",
                });
                router.push("/browse");
            } else {
                toast.error("Claim Failed", {
                    description: apiError?.message ?? "Something went wrong. Please try again.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [donation.id, disabled, isLoading, onClaimSuccess, router]);

    // Handle navigation to claim details
    const handleViewClaim = useCallback(() => {
        router.push("/claims");
    }, [router]);

    // Handle dialog close
    const handleCloseDialog = useCallback(() => {
        setShowSuccessDialog(false);
        // Optionally refresh the page to show updated status
        router.refresh();
    }, [router]);

    return (
        <>
            <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover={!isLoading && !disabled ? "hover" : "idle"}
                whileTap={!isLoading && !disabled ? "tap" : "idle"}
            >
                <Button
                    variant={variant}
                    size={size}
                    onClick={handleClaim}
                    disabled={isLoading || disabled}
                    className={cn(
                        "gap-2 transition-all",
                        variant === "default" && "bg-emerald-600 hover:bg-emerald-700",
                        className
                    )}
                    aria-label={`Claim donation: ${donation.title}`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {!compact && "Claiming..."}
                        </>
                    ) : (
                        <>
                            <Hand className="h-4 w-4" />
                            {!compact && "Claim This Donation"}
                        </>
                    )}
                </Button>
            </motion.div>

            {/* Success Dialog */}
            <ClaimSuccessDialog
                isOpen={showSuccessDialog}
                onClose={handleCloseDialog}
                donation={donation}
                pickupCode={pickupCode}
                onViewClaim={handleViewClaim}
            />
        </>
    );
}
