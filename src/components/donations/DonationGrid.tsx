import Link from "next/link";
import { Inbox, Plus } from "lucide-react";

import { DonationCard } from "@/components/donations/DonationCard";
import { Button } from "@/components/ui/button";
import { StaggerContainer } from "@/components/ui/stagger-container";
import { CardSkeleton } from "@/components/ui/animated-card";
import { Fade } from "@/components/ui/motion-system";
import { Donation } from "@/types/donation";
import { cn } from "@/lib/utils";

interface DonationGridProps {
    donations: Donation[];
    isLoading: boolean;
    className?: string;
    /** Enable layout animations for list reordering */
    enableLayoutAnimation?: boolean;
}

const SKELETON_COUNT = 6;

export function DonationGrid({ donations, isLoading, className, enableLayoutAnimation = true }: DonationGridProps) {
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
                {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                    <CardSkeleton key={idx} lines={3} />
                ))}
            </div>
        );
    }

    if (!donations.length) {
        return (
            <Fade direction="up" distance={30}>
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/40 p-10 text-center shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                        <Inbox className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                        <p className="text-base font-semibold">No donations yet</p>
                        <p className="text-sm text-muted-foreground">Create your first donation to start making an impact.</p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/donations/create">
                            <Plus className="h-4 w-4" aria-hidden />
                            Create Donation
                        </Link>
                    </Button>
                </div>
            </Fade>
        );
    }

    return (
        <StaggerContainer
            effect="slide-up"
            staggerDelay={0.08}
            distance={24}
            className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
        >
            {donations.map((donation) => (
                <DonationCard
                    key={donation.id}
                    donation={donation}
                    actionLabel="Manage"
                />
            ))}
        </StaggerContainer>
    );
}
