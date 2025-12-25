"use client";

import { motion } from "framer-motion";
import { Lock, UserCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Claim } from "@/types/claim";

interface ReservedBadgeProps {
    /** The claim information */
    claim?: Claim | null;
    /** Whether this is the current user's claim */
    isOwner?: boolean;
    /** Additional class names */
    className?: string;
}

const badgeVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2 }
    },
};

export function ReservedBadge({ claim, isOwner = false, className }: ReservedBadgeProps) {
    if (isOwner) {
        // Show "Your Claim" badge for the volunteer who claimed it
        return (
            <motion.div
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
            >
                <Card className={cn(
                    "border-emerald-200 bg-emerald-50",
                    className
                )}>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium text-emerald-900">Your Claim</p>
                            <p className="text-sm text-emerald-700">
                                You claimed this donation
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Show "Reserved" badge for other users
    const volunteerName = claim?.volunteer?.name ?? "Another volunteer";

    return (
        <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
        >
            <Card className={cn(
                "border-blue-200 bg-blue-50",
                className
            )}>
                <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium text-blue-900">Reserved</p>
                        <p className="text-sm text-blue-700">
                            Claimed by {volunteerName}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
