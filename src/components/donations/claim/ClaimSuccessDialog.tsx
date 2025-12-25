"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { Check, Copy, MapPin, Phone, User, X, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPickupCode } from "@/lib/validators/claim";
import type { Donation } from "@/types/donation";

interface ClaimSuccessDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Callback when dialog is closed */
    onClose: () => void;
    /** The donation that was claimed */
    donation: Donation;
    /** The pickup code from the claim response */
    pickupCode: string;
    /** Optional: Navigate to claimed donation */
    onViewClaim?: () => void;
}

// Animation variants for celebratory entrance
const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const dialogVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 10,
        transition: { duration: 0.2 },
    },
};

const confettiVariants: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: {
            delay: 0.1 + i * 0.05,
            type: "spring" as const,
            stiffness: 400,
            damping: 15,
        },
    }),
};

const checkmarkVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
        scale: 1,
        rotate: 0,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 15,
            delay: 0.2,
        },
    },
};

export function ClaimSuccessDialog({
    isOpen,
    onClose,
    donation,
    pickupCode,
    onViewClaim,
}: ClaimSuccessDialogProps) {
    const [codeCopied, setCodeCopied] = useState(false);
    const formattedCode = formatPickupCode(pickupCode);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Copy pickup code to clipboard
    const handleCopyCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(pickupCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = pickupCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    }, [pickupCode]);

    // Get donor info safely
    const donorName = donation.donor?.name ?? "Donor";
    const donorPhone = donation.donor?.phone ?? null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        variants={overlayVariants}
                        onClick={onClose}
                    />

                    {/* Dialog */}
                    <motion.div
                        className="relative z-10 mx-4 w-full max-w-md"
                        variants={dialogVariants}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="claim-success-title"
                    >
                        <Card className="overflow-hidden border-0 shadow-2xl">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                aria-label="Close dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Success Header */}
                            <CardHeader className="relative bg-linear-to-br from-emerald-500 to-teal-600 pb-12 pt-8 text-center text-white">
                                {/* Confetti decoration */}
                                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            custom={i}
                                            variants={confettiVariants}
                                            initial="hidden"
                                            animate="visible"
                                            style={{
                                                left: `${15 + i * 15}%`,
                                                top: `${10 + (i % 3) * 15}%`,
                                            }}
                                        >
                                            <PartyPopper
                                                className="h-5 w-5 text-yellow-300/70"
                                                style={{ transform: `rotate(${i * 60}deg)` }}
                                            />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Checkmark Icon */}
                                <motion.div
                                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                                    variants={checkmarkVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <Check className="h-8 w-8 text-white" strokeWidth={3} />
                                </motion.div>

                                <CardTitle
                                    id="claim-success-title"
                                    className="mt-4 text-2xl font-bold"
                                >
                                    Donation Claimed!
                                </CardTitle>
                                <CardDescription className="text-emerald-100">
                                    You&apos;re making a difference today 🌟
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5 p-6">
                                {/* Pickup Code Section */}
                                <div className="rounded-xl bg-secondary/50 p-4 text-center">
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Your Pickup Code
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
                                            {formattedCode}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={handleCopyCode}
                                            aria-label={codeCopied ? "Copied!" : "Copy code"}
                                        >
                                            {codeCopied ? (
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Show this code to the donor at pickup
                                    </p>
                                </div>

                                <Separator />

                                {/* Donor Contact Info */}
                                <div className="space-y-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Donor Contact
                                    </p>

                                    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{donorName}</p>
                                            {donorPhone ? (
                                                <a
                                                    href={`tel:${donorPhone}`}
                                                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {donorPhone}
                                                </a>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No phone provided
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pickup Location */}
                                    {donation.pickup_address && (
                                        <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Pickup Location
                                                </p>
                                                <p className="text-sm text-foreground">
                                                    {donation.pickup_address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="flex gap-3 border-t bg-secondary/30 px-6 py-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                                {onViewClaim && (
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => {
                                            onClose();
                                            onViewClaim();
                                        }}
                                    >
                                        View Details
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
