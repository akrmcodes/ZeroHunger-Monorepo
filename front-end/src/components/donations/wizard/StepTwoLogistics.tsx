"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DonationFormValues } from "@/lib/validators/donation";
import { MapSkeleton as LocationPickerSkeleton } from "@/components/map/MapSkeleton"; 
import type { GeoCoordinates } from "@/hooks/useGeolocation";

// ✅ التصحيح: إزالة .then ليعمل مع Default Export
const LocationPicker = dynamic(
    () => import("@/components/map/LocationPicker"), 
    {
        ssr: false,
        loading: () => <LocationPickerSkeleton height="280px" showControls={false} />,
    }
);

interface StepTwoLogisticsProps {
    onBack: () => void;
    onNext: () => void;
}

export function StepTwoLogistics({ onBack, onNext }: StepTwoLogisticsProps) {
    const form = useFormContext<DonationFormValues>();

    // Handle location change from the map picker
    const handleLocationChange = useCallback(
        (coords: GeoCoordinates) => {
            form.setValue("latitude", coords.latitude, { shouldValidate: true, shouldDirty: true });
            form.setValue("longitude", coords.longitude, { shouldValidate: true, shouldDirty: true });
        },
        [form]
    );

    // Handle address change from the map picker
    const handleAddressChange = useCallback(
        (address: string) => {
            // Only update if the address field is empty or contains coordinates
            const currentAddress = form.getValues("pickup_address");
            if (!currentAddress || currentAddress.startsWith("Lat:")) {
                form.setValue("pickup_address", address, { shouldValidate: true, shouldDirty: true });
            }
        },
        [form]
    );

    const handleNext = form.handleSubmit(() => {
        onNext();
    });

    // Get current coordinates from form
    const latitude = form.watch("latitude");
    const longitude = form.watch("longitude");

    return (
        <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
        >
            {/* Location Picker Map */}
            <FormItem className="space-y-2">
                <FormLabel>Pickup Location</FormLabel>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        onLocationChange={handleLocationChange}
                        onAddressChange={handleAddressChange}
                        height="280px"
                    />
                </div>
                {/* Show validation errors for coordinates */}
                {form.formState.errors.latitude && (
                    <p className="text-sm text-destructive">Please select a location on the map</p>
                )}
            </FormItem>

            <FormField
                control={form.control}
                name="pickup_address"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel>Pickup Address / Description</FormLabel>
                        <FormControl>
                            <textarea
                                rows={2}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                placeholder="Add pickup address or describe the location (e.g., 'Blue building, 3rd floor')"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel>Expiry (date & time)</FormLabel>
                        <FormControl>
                            <Input type="datetime-local" className="[&::-webkit-calendar-picker-indicator]:cursor-pointer" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" type="button" onClick={onBack}>
                    Back
                </Button>
                <Button type="button" onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                    Review / Next
                </Button>
            </div>
        </motion.div>
    );
}