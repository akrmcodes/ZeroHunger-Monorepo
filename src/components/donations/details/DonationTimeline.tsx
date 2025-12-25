"use client";

import { Ban, CheckCircle2, Clock, PackageCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Donation, DonationStatus } from "@/types/donation";

interface DonationTimelineProps {
    donation: Donation;
}

const stepOrder = [
    DonationStatus.Pending,
    DonationStatus.Claimed,
    DonationStatus.PickedUp,
    DonationStatus.Delivered,
];

const stepMeta: Record<DonationStatus, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    [DonationStatus.Pending]: { label: "Created", Icon: Clock },
    [DonationStatus.Claimed]: { label: "Claimed", Icon: PackageCheck },
    [DonationStatus.PickedUp]: { label: "Picked Up", Icon: Truck },
    [DonationStatus.Delivered]: { label: "Delivered", Icon: CheckCircle2 },
    [DonationStatus.Expired]: { label: "Expired", Icon: Clock },
    [DonationStatus.Cancelled]: { label: "Cancelled", Icon: Ban },
};

export function DonationTimeline({ donation }: DonationTimelineProps) {
    const statusIndexLookup: Record<string, number> = {
        pending: 0,
        available: 0,
        claimed: 1,
        active: 1,
        picked_up: 2,
        delivered: 3,
    };

    const normalizedStatus = String(donation.status).toLowerCase();
    const currentIndex = statusIndexLookup[normalizedStatus] ?? 0;

    const timestamps: Partial<Record<DonationStatus, string | null>> = {
        [DonationStatus.Pending]: donation.created_at,
        [DonationStatus.Claimed]: donation.claim?.created_at ?? null,
        [DonationStatus.PickedUp]: donation.claim?.picked_up_at ?? null,
        [DonationStatus.Delivered]: donation.claim?.delivered_at ?? null,
    };

    return (
        <div className="space-y-4 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Timeline</p>
            <div className="relative">
                <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-border" aria-hidden />
                <div className="space-y-6">
                    {stepOrder.map((step, index) => {
                        const meta = stepMeta[step];
                        const isActive = index === currentIndex;
                        const isCompleted = index < currentIndex;
                        const isPending = !timestamps[step];

                        return (
                            <div key={step} className="relative pl-12">
                                <div
                                    className={cn(
                                        "absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border",
                                        isCompleted && "border-primary bg-primary text-primary-foreground",
                                        isActive && !isCompleted && "border-primary bg-primary/10 text-primary",
                                        !isActive && !isCompleted && "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    <meta.Icon className="h-4 w-4" aria-hidden />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">{meta.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {timestamps[step]
                                            ? new Date(timestamps[step] as string).toLocaleString()
                                            : isPending
                                                ? "Pending"
                                                : ""}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}