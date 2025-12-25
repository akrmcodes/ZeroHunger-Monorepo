"use client";

import { useState, useCallback } from "react";
import { Loader2, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, type ApiError } from "@/lib/api";

interface CancelClaimDialogProps {
    claimId: number;
    donationTitle?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CancelClaimDialog({
    claimId,
    donationTitle,
    open,
    onOpenChange,
    onSuccess,
}: CancelClaimDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = useCallback(async () => {
        setIsLoading(true);

        try {
            await api.claims.cancel(claimId);
            toast.success("Claim cancelled", {
                description: "The donation is now available for others to claim.",
            });
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            const apiError = error as ApiError;

            if (apiError.status === 409) {
                toast.error("Cannot cancel claim", {
                    description: "This claim has already been picked up or delivered.",
                });
            } else if (apiError.status === 404) {
                toast.error("Claim not found", {
                    description: "This claim may have already been cancelled.",
                });
                onOpenChange(false);
                onSuccess?.(); // Still refresh to update UI
            } else {
                toast.error("Failed to cancel claim", {
                    description: apiError.message || "Please try again later.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [claimId, onOpenChange, onSuccess]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <TriangleAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-center">Cancel This Claim?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        {donationTitle ? (
                            <>
                                You&apos;re about to cancel your claim on{" "}
                                <span className="font-medium text-foreground">{donationTitle}</span>.
                            </>
                        ) : (
                            "You're about to cancel this claim."
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="my-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                        <strong>What happens next:</strong>
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-amber-700">
                        <li>The donation will become available for other volunteers</li>
                        <li>You won&apos;t be able to undo this action</li>
                        <li>The donor will be notified</li>
                    </ul>
                </div>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                    <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Yes, Cancel Claim
                            </>
                        )}
                    </AlertDialogAction>
                    <AlertDialogCancel disabled={isLoading} className="w-full">
                        Keep My Claim
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
