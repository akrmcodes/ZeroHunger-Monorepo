"use client";

import { useMemo } from "react";
import { CalendarClock, Loader2, MapPin, Package, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DonationFormValues } from "@/lib/validators/donation";
import { formatFoodType } from "@/lib/utils/formatters";

interface StepThreeReviewProps {
    onBack: () => void;
}

export function StepThreeReview({ onBack }: StepThreeReviewProps) {
    const form = useFormContext<DonationFormValues>();
    const values = form.getValues();

    const formattedExpiry = useMemo(() => {
        if (!values.expires_at) return "Not set";
        const date = new Date(values.expires_at);
        return Number.isNaN(date.getTime()) ? values.expires_at : date.toLocaleString(undefined, { hour12: false });
    }, [values.expires_at]);

    return (
        <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
        >
            <Card className="border-border/80">
                <CardContent className="space-y-4 pt-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-xs uppercase text-muted-foreground">Title</p>
                            <p className="text-base font-semibold text-foreground">{values.title || "Untitled donation"}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <UtensilsCrossed className="h-4 w-4" aria-hidden />
                            {formatFoodType(values.food_type)}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card px-3 py-2">
                            <Package className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                            <div className="space-y-1">
                                <p className="text-xs uppercase text-muted-foreground">Quantity</p>
                                <p className="text-sm font-medium">{values.quantity} kg</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card px-3 py-2">
                            <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                            <div className="space-y-1">
                                <p className="text-xs uppercase text-muted-foreground">Expires</p>
                                <p className="text-sm font-medium">{formattedExpiry}</p>
                            </div>
                        </div>
                        <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-border/70 bg-card px-3 py-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                            <div className="space-y-1">
                                <p className="text-xs uppercase text-muted-foreground">Pickup Address</p>
                                <p className="text-sm font-medium leading-relaxed">{values.pickup_address || "Not provided"}</p>
                            </div>
                        </div>
                        <div className="sm:col-span-2 rounded-lg border border-border/70 bg-card px-3 py-2">
                            <p className="text-xs uppercase text-muted-foreground">Description</p>
                            <p className="mt-1 text-sm text-foreground">{values.description || "No description"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={onBack}>
                    Back
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                    Confirm Donation
                </Button>
            </div>
        </motion.div>
    );
}
