"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Soup } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { PickupControl } from "@/components/donations/details/PickupControl";
import { DonationTimeline } from "@/components/donations/details/DonationTimeline";
import { VolunteerInfo } from "@/components/donations/details/VolunteerInfo";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Donation, DonationStatus, FoodType } from "@/types/donation";

export default function DonationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [donation, setDonation] = useState<Donation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
        const donationId = Number(idParam);
        if (!donationId) return;

        const fetchDonation = async () => {
            try {
                const res = await api.donations.get(donationId);
                setDonation(res.data);
            } catch (error) {
                const apiError = error as ApiError;
                if (apiError?.status === 404) {
                    setNotFound(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonation();
    }, [params?.id]);

    const foodTypeLabel = useMemo(() => {
        if (!donation) return "";
        const labels: Record<FoodType, string> = {
            [FoodType.CookedMeal]: "Cooked Meal",
            [FoodType.Groceries]: "Groceries",
            [FoodType.Bakery]: "Bakery",
            [FoodType.Vegetables]: "Vegetables",
            [FoodType.Canned]: "Canned",
        };
        return labels[donation.food_type ?? FoodType.CookedMeal];
    }, [donation]);

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <Skeleton className="h-72 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            </div>
        );
    }

    if (notFound || !donation) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-lg font-semibold">Donation not found</p>
                <p className="text-sm text-muted-foreground">It may have been removed or the link is invalid.</p>
                <Button onClick={() => router.push("/donations")}>Back to Donations</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-semibold">{donation.title}</CardTitle>
                        <StatusBadge status={donation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">Expires {new Date(donation.expires_at).toLocaleString()}</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/donations">
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card className="shadow-sm">
                        <CardHeader className="space-y-1">
                            <p className="text-xs uppercase text-muted-foreground">Food Type</p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Soup className="h-4 w-4" aria-hidden /> {foodTypeLabel}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs uppercase text-muted-foreground">Description</p>
                                <p className="text-sm leading-relaxed text-foreground">{donation.description ?? "No description"}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <span className="font-semibold">{donation.quantity} kg</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                                    <span className="font-medium">{donation.pickup_address}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <DonationTimeline donation={donation} />
                </div>

                <div className="space-y-4 lg:sticky lg:top-4">
                    <PickupControl donation={donation} />
                    <VolunteerInfo donation={donation} />
                </div>
            </div>
        </div>
    );
}