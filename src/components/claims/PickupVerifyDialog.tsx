"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, PackageCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { api, type ApiError } from "@/lib/api";
import { PICKUP_CODE_LENGTH, isValidPickupCode } from "@/lib/validators/claim";
import { cn } from "@/lib/utils";

interface PickupVerifyDialogProps {
    claimId: number;
    donationTitle?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type DialogState = "input" | "loading" | "success" | "error";

const shakeAnimation = {
    shake: {
        x: [0, -12, 12, -12, 12, -6, 6, 0],
        transition: { duration: 0.5 },
    },
};

export function PickupVerifyDialog({
    claimId,
    donationTitle,
    open,
    onOpenChange,
    onSuccess,
}: PickupVerifyDialogProps) {
    const [code, setCode] = useState("");
    const [state, setState] = useState<DialogState>("input");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [shouldShake, setShouldShake] = useState(false);

    const resetState = useCallback(() => {
        setCode("");
        setState("input");
        setErrorMessage("");
        setShouldShake(false);
    }, []);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                // Allow closing only if not loading
                if (state !== "loading") {
                    resetState();
                    onOpenChange(false);
                }
            } else {
                onOpenChange(true);
            }
        },
        [state, resetState, onOpenChange]
    );

    const handleSubmit = useCallback(async () => {
        if (!isValidPickupCode(code)) {
            setErrorMessage("Please enter a valid 6-digit code");
            setShouldShake(true);
            setTimeout(() => setShouldShake(false), 600);
            return;
        }

        setState("loading");
        setErrorMessage("");

        try {
            await api.claims.markPickedUp(claimId, code);
            setState("success");
            toast.success("Pickup verified successfully!");

            // Auto-close after success animation
            setTimeout(() => {
                onOpenChange(false);
                resetState();
                onSuccess?.();
            }, 1500);
        } catch (error) {
            const apiError = error as ApiError;
            setState("error");

            // Determine error type
            if (apiError.status === 422) {
                setErrorMessage("Invalid pickup code. Please check with the donor.");
            } else if (apiError.status === 409) {
                setErrorMessage("This donation has already been picked up.");
            } else {
                setErrorMessage(apiError.message || "Something went wrong. Please try again.");
            }

            // Trigger shake animation
            setShouldShake(true);
            setTimeout(() => {
                setShouldShake(false);
                setState("input");
            }, 600);
        }
    }, [code, claimId, onOpenChange, resetState, onSuccess]);

    const handleCodeComplete = useCallback(
        (value: string) => {
            setCode(value);
            if (value.length === PICKUP_CODE_LENGTH) {
                // Auto-submit when code is complete
                setTimeout(() => {
                    if (isValidPickupCode(value)) {
                        handleSubmit();
                    }
                }, 150);
            }
        },
        [handleSubmit]
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <AnimatePresence mode="wait">
                    {state === "success" ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center justify-center gap-4 py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                            >
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <p className="text-lg font-semibold text-foreground">Pickup Verified!</p>
                                <p className="text-sm text-muted-foreground">You can now deliver the donation.</p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <DialogHeader className="text-center sm:text-center">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <PackageCheck className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle>Verify Pickup</DialogTitle>
                                <DialogDescription>
                                    {donationTitle ? (
                                        <>
                                            Enter the 6-digit code from the donor to confirm pickup of{" "}
                                            <span className="font-medium text-foreground">{donationTitle}</span>.
                                        </>
                                    ) : (
                                        "Enter the 6-digit code from the donor to confirm pickup."
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <motion.div
                                className="my-6 flex flex-col items-center gap-4"
                                animate={shouldShake ? "shake" : undefined}
                                variants={shakeAnimation}
                            >
                                <InputOTP
                                    maxLength={PICKUP_CODE_LENGTH}
                                    value={code}
                                    onChange={setCode}
                                    onComplete={handleCodeComplete}
                                    disabled={state === "loading"}
                                    className={cn(
                                        errorMessage && "aria-invalid:border-destructive"
                                    )}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} className={cn(errorMessage && "border-destructive")} />
                                        <InputOTPSlot index={1} className={cn(errorMessage && "border-destructive")} />
                                        <InputOTPSlot index={2} className={cn(errorMessage && "border-destructive")} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} className={cn(errorMessage && "border-destructive")} />
                                        <InputOTPSlot index={4} className={cn(errorMessage && "border-destructive")} />
                                        <InputOTPSlot index={5} className={cn(errorMessage && "border-destructive")} />
                                    </InputOTPGroup>
                                </InputOTP>

                                <AnimatePresence mode="wait">
                                    {errorMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="flex items-center gap-2 text-sm text-destructive"
                                        >
                                            <ShieldAlert className="h-4 w-4" />
                                            <span>{errorMessage}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <DialogFooter className="flex-col gap-2 sm:flex-col">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={code.length !== PICKUP_CODE_LENGTH || state === "loading"}
                                    className="w-full"
                                >
                                    {state === "loading" ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <PackageCheck className="mr-2 h-4 w-4" />
                                            Verify Pickup
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={state === "loading"}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
