"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, Loader2, Sparkles, Truck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type ApiError } from "@/lib/api";
import { DELIVERY_NOTES_MAX_LENGTH } from "@/lib/validators/claim";

interface DeliverConfirmDialogProps {
    claimId: number;
    donationTitle?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type DialogState = "form" | "loading" | "success";

const IMPACT_POINTS_EARNED = 20; // Delivery earns 2x points

const confettiVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: (i: number) => ({
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.8],
        y: [0, -20 - i * 10, 10],
        x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5), 0],
        rotate: [0, 180, 360],
        transition: { duration: 1.2, delay: i * 0.1 },
    }),
};

export function DeliverConfirmDialog({
    claimId,
    donationTitle,
    open,
    onOpenChange,
    onSuccess,
}: DeliverConfirmDialogProps) {
    const [notes, setNotes] = useState("");
    const [state, setState] = useState<DialogState>("form");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const resetState = useCallback(() => {
        setNotes("");
        setState("form");
        setErrorMessage("");
    }, []);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen && state !== "loading") {
                resetState();
                onOpenChange(false);
            } else if (nextOpen) {
                onOpenChange(true);
            }
        },
        [state, resetState, onOpenChange]
    );

    const handleSubmit = useCallback(async () => {
        setState("loading");
        setErrorMessage("");

        try {
            await api.claims.markDelivered(claimId, notes.trim() || undefined);
            setState("success");
            toast.success("Delivery confirmed! Thank you for your help.");

            // Auto-close after celebration
            setTimeout(() => {
                onOpenChange(false);
                resetState();
                onSuccess?.();
            }, 2500);
        } catch (error) {
            const apiError = error as ApiError;
            setState("form");

            if (apiError.status === 409) {
                setErrorMessage("Please verify pickup first before confirming delivery.");
                toast.error("Pickup not verified", {
                    description: "You need to pick up the donation before marking it as delivered.",
                });
            } else {
                setErrorMessage(apiError.message || "Something went wrong. Please try again.");
                toast.error("Delivery confirmation failed", {
                    description: apiError.message,
                });
            }
        }
    }, [claimId, notes, onOpenChange, resetState, onSuccess]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <AnimatePresence mode="wait">
                    {state === "success" ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative flex flex-col items-center justify-center gap-4 py-8"
                        >
                            {/* Confetti particles */}
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={confettiVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="absolute left-1/2 top-1/2"
                                        style={{
                                            width: 8 + (i % 3) * 4,
                                            height: 8 + (i % 3) * 4,
                                            borderRadius: i % 2 === 0 ? "50%" : "2px",
                                            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"][i % 5],
                                        }}
                                    />
                                ))}
                            </div>

                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 shadow-lg"
                            >
                                <CheckCircle2 className="h-12 w-12 text-white" />
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.2, 1] }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                    className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-md"
                                >
                                    <Sparkles className="h-4 w-4 text-white" />
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <p className="text-xl font-bold text-foreground">Mission Complete!</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    You&apos;ve made a real difference today.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2"
                            >
                                <Award className="h-5 w-5 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-800">
                                    +{IMPACT_POINTS_EARNED} Impact Points Earned!
                                </span>
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
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                    <Truck className="h-6 w-6 text-emerald-600" />
                                </div>
                                <DialogTitle>Confirm Delivery</DialogTitle>
                                <DialogDescription>
                                    {donationTitle ? (
                                        <>
                                            You&apos;re about to mark{" "}
                                            <span className="font-medium text-foreground">{donationTitle}</span> as
                                            delivered.
                                        </>
                                    ) : (
                                        "You're about to mark this donation as delivered."
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-medium">
                                        Delivery Notes{" "}
                                        <span className="text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="e.g., Left with the front desk, recipient was very grateful..."
                                        maxLength={DELIVERY_NOTES_MAX_LENGTH}
                                        disabled={state === "loading"}
                                        className="min-h-24 resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {notes.length}/{DELIVERY_NOTES_MAX_LENGTH}
                                    </p>
                                </div>

                                {errorMessage && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-destructive"
                                    >
                                        {errorMessage}
                                    </motion.p>
                                )}

                                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                                    <Award className="h-4 w-4 text-amber-500" />
                                    <p className="text-sm text-muted-foreground">
                                        You&apos;ll earn{" "}
                                        <span className="font-semibold text-amber-600">
                                            +{IMPACT_POINTS_EARNED} points
                                        </span>{" "}
                                        for completing this delivery!
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="flex-col gap-2 sm:flex-col">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={state === "loading"}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {state === "loading" ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Confirm Delivery
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
