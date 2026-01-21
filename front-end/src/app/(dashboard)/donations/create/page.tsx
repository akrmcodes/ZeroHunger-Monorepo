"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { StepOneDetails } from "@/components/donations/wizard/StepOneDetails";
import { StepTwoLogistics } from "@/components/donations/wizard/StepTwoLogistics";
import { StepThreeReview } from "@/components/donations/wizard/StepThreeReview";
import { WizardStepIndicator } from "@/components/donations/wizard/WizardStepIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { donationSchema, type DonationFormValues } from "@/lib/validators/donation";
import { FoodType } from "@/types/donation";
import { useNotifications } from "@/context/NotificationContext";

const TOTAL_STEPS = 3;

type DonationFormInput = z.input<typeof donationSchema>;

export default function Page() {
    const [step, setStep] = useState<number>(1);
    const router = useRouter();
    const { addNotification } = useNotifications();

    const formMethods = useForm<DonationFormInput, undefined, DonationFormValues>({
        resolver: zodResolver(donationSchema),
        defaultValues: useMemo(
            () => ({
                title: "",
                description: "",
                food_type: FoodType.CookedMeal,
                quantity: 1,
                pickup_address: "",
                expires_at: "",
            }),
            []
        ),
        mode: "onChange",
    });

    const goNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

    const onSubmit = async (data: DonationFormValues) => {
        try {
            // Validate coordinates are set (not default 0,0)
            if (!data.latitude || !data.longitude || (data.latitude === 0 && data.longitude === 0)) {
                toast.error("Please select a pickup location on the map");
                return;
            }

            await api.donations.create({
                title: data.title,
                description: data.description,
                food_type: data.food_type,
                quantity: data.quantity,
                expires_at: data.expires_at,
                pickup_address: data.pickup_address,
                latitude: data.latitude,
                longitude: data.longitude,
            });
            toast.success("Donation created successfully!");
            addNotification(
                "Donation Created",
                "Your donation is now live for volunteers.",
                "success"
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            router.push("/donations");
        } catch (error) {
            toast.error("Failed to create donation");
        }
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold">Create New Donation</CardTitle>
                    <p className="text-sm text-muted-foreground">Craft a clear, high-impact donation in a few guided steps.</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/donations">
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back
                    </Link>
                </Button>
            </div>

            <Card className="mx-auto w-full max-w-2xl">
                <CardHeader>
                    <WizardStepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
                </CardHeader>
                <CardContent>
                    <FormProvider {...formMethods}>
                        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatePresence mode="wait" initial={false}>
                                {step === 1 && <StepOneDetails key="step-1" onNext={goNext} />}
                                {step === 2 && (
                                    <StepTwoLogistics key="step-2" onBack={goBack} onNext={goNext} />
                                )}
                                {step === 3 && <StepThreeReview key="step-3" onBack={goBack} />}
                            </AnimatePresence>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    );
}
