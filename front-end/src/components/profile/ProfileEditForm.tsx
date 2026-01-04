"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
    User,
    Phone,
    MapPin,
    Loader2,
    Check,
    AlertCircle,
    X,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapSkeleton } from "@/components/map/MapSkeleton";

// =============================================================================
// Dynamic Import: LocationPicker (SSR Disabled)
// Leaflet requires `window` which doesn't exist on the server.
// =============================================================================
const LocationPicker = dynamic(
    () => import("@/components/map/LocationPicker").then((mod) => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <MapSkeleton height="250px" showControls={false} />,
    }
);
import { api, type User as UserType } from "@/lib/api";
import { profileSchema, type ProfileFormValues } from "@/types/profile";
import { cn } from "@/lib/utils";
import type { GeoCoordinates } from "@/hooks/useGeolocation";

// Form input type for React Hook Form
type ProfileFormInput = z.input<typeof profileSchema>;

// =============================================================================
// Props
// =============================================================================

interface ProfileEditFormProps {
    user: UserType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProfileUpdate: (updatedUser: UserType) => void;
}

// =============================================================================
// Animation Variants
// =============================================================================

const formVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 25,
        },
    },
};

const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 15,
        },
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

// =============================================================================
// Component
// =============================================================================

export function ProfileEditForm({
    user,
    open,
    onOpenChange,
    onProfileUpdate,
}: ProfileEditFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ==========================================================================
    // FORM SETUP
    // CRITICAL: defaultValues must match what Zod expects after preprocessing
    // - name: string (required)
    // - phone: string (optional, default "")  
    // - latitude/longitude: number | null (preprocessed from any input)
    // ==========================================================================
    const form = useForm<ProfileFormInput, undefined, ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name ?? "",
            phone: user.phone ?? "",
            latitude: user.latitude ?? null,
            longitude: user.longitude ?? null,
        },
        mode: "onBlur", // Validate on blur to catch issues early
    });

    // Reset form when user changes or sheet opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: user.name ?? "",
                phone: user.phone ?? "",
                latitude: user.latitude ?? null,
                longitude: user.longitude ?? null,
            });
        }
    }, [open, user, form]);

    // Handle location change from LocationPicker
    const handleLocationChange = useCallback(
        (coords: GeoCoordinates) => {
            // Ensure we're setting actual numbers
            form.setValue("latitude", coords.latitude, { shouldValidate: true, shouldDirty: true });
            form.setValue("longitude", coords.longitude, { shouldValidate: true, shouldDirty: true });
        },
        [form]
    );

    // Handle validation errors - ENHANCED debugging
    const onInvalid = (errors: Record<string, unknown>) => {
        console.error("🚨 Form validation failed:", JSON.stringify(errors, null, 2));
        console.log("📋 Current form values:", form.getValues());
        console.log("📋 Form state:", {
            isDirty: form.formState.isDirty,
            isValid: form.formState.isValid,
            errors: form.formState.errors,
        });
    };

    // Form submission - with explicit type safety
    const onSubmit = async (values: ProfileFormValues) => {
        console.log("✅ Form validated successfully, values:", values);
        setIsSubmitting(true);

        try {
            // Build payload with proper type handling
            const payload = {
                name: values.name,
                phone: values.phone || undefined,
                latitude: values.latitude != null ? Number(values.latitude) : undefined,
                longitude: values.longitude != null ? Number(values.longitude) : undefined,
            };

            const response = await api.profile.update(payload);

            // Show success animation
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onProfileUpdate(response.data.user);
                onOpenChange(false);
                toast.success("Profile updated successfully!", {
                    description: "Your changes have been saved.",
                });
            }, 1200);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to update profile";
            toast.error("Update failed", { description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Watch form values for location - explicit typing to avoid TypeScript inference issues
    const latitude = form.watch("latitude") as number | null | undefined;
    const longitude = form.watch("longitude") as number | null | undefined;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                            <User className="size-5" />
                        </div>
                        Edit Profile
                    </SheetTitle>
                    <SheetDescription>
                        Update your personal information and preferences.
                    </SheetDescription>
                </SheetHeader>

                {/* Success Overlay */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            variants={successVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring" as const,
                                    stiffness: 300,
                                    damping: 15,
                                    delay: 0.1,
                                }}
                                className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-xl"
                            >
                                <Check className="size-10" strokeWidth={3} />
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 text-lg font-semibold text-slate-900"
                            >
                                Profile Updated!
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                        <motion.div
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6"
                        >
                            {/* Personal Information Section */}
                            <motion.div variants={fieldVariants}>
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    Personal Information
                                </h3>

                                <div className="space-y-4">
                                    {/* Name Field */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <User className="size-4 text-slate-500" />
                                                    Full Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter your full name"
                                                        className="h-11"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Phone Field */}
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Phone className="size-4 text-slate-500" />
                                                    Phone Number
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        placeholder="+1 (555) 000-0000"
                                                        className="h-11"
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Used for donation pickup coordination
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </motion.div>

                            <Separator />

                            {/* Location Section */}
                            <motion.div variants={fieldVariants}>
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    Your Location
                                </h3>

                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <MapPin className="size-4 text-slate-500" />
                                        Default Location
                                    </FormLabel>
                                    <FormDescription className="mb-3">
                                        Set your default location for donations and pickups
                                    </FormDescription>

                                    {/* Location Status */}
                                    <div
                                        className={cn(
                                            "mb-3 flex items-center gap-2 rounded-lg p-3 text-sm",
                                            latitude && longitude
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                        )}
                                    >
                                        {latitude && longitude ? (
                                            <>
                                                <Check className="size-4" />
                                                <span>
                                                    Location set: {Number(latitude).toFixed(4)}, {" "}
                                                    {Number(longitude).toFixed(4)}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="size-4" />
                                                <span>No location set - click on the map or use &quot;My Location&quot;</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Location Picker */}
                                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                        <LocationPicker
                                            latitude={latitude ?? null}
                                            longitude={longitude ?? null}
                                            onLocationChange={handleLocationChange}
                                            height="250px"
                                        />
                                    </div>
                                </FormItem>
                            </motion.div>

                            <Separator />

                            {/* Actions */}
                            <motion.div
                                variants={fieldVariants}
                                className="flex gap-3 pt-2"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    <X className="mr-2 size-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 size-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </motion.div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}

export default ProfileEditForm;
