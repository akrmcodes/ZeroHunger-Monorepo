import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import { motion } from "framer-motion";

import { DonationCard } from "@/components/donations/DonationCard";
import { Button } from "@/components/ui/button";
import { Donation } from "@/types/donation";
import { cn } from "@/lib/utils";

interface DonationGridProps {
    donations: Donation[];
    isLoading: boolean;
    className?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

const SKELETON_COUNT = 6;

export function DonationGrid({ donations, isLoading, className }: DonationGridProps) {
    if (isLoading) {
        return (
            <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
                {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                    <div
                        key={idx}
                        className="animate-pulse rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className="h-4 w-24 rounded bg-muted" />
                            <div className="h-5 w-16 rounded-full bg-muted" />
                        </div>
                        <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
                        <div className="mb-2 h-3 w-1/2 rounded bg-muted" />
                        <div className="mb-6 h-3 w-2/3 rounded bg-muted" />
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-24 rounded bg-muted" />
                            <div className="h-8 w-24 rounded bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!donations.length) {
        return (
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
        );
    }

    return (
        <motion.div
            className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {donations.map((donation) => (
                <motion.div key={donation.id} variants={itemVariants}>
                    <DonationCard donation={donation} actionLabel="Manage" />
                </motion.div>
            ))}
        </motion.div>
    );
}
