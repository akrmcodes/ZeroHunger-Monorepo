"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Award,
    CheckCircle2,
    Copy,
    ExternalLink,
    MapPin,
    PackageCheck,
    Phone,
    Truck,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { CancelClaimDialog } from "@/components/claims/CancelClaimDialog";
import { DeliverConfirmDialog } from "@/components/claims/DeliverConfirmDialog";
import { PickupVerifyDialog } from "@/components/claims/PickupVerifyDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { cn } from "@/lib/utils";
import { formatFoodType, formatQuantity } from "@/lib/utils/formatters";
import { Claim } from "@/types/claim";
import { Donation, DonationStatus } from "@/types/donation";

export interface ClaimWithDonation extends Claim {
    donation?: Donation;
}

interface ClaimCardProps {
    claim: ClaimWithDonation;
    index?: number;
    onStatusChange?: () => void;
}

const statusAccent: Record<string, string> = {
    active: "border-l-4 border-l-emerald-500",
    picked_up: "border-l-4 border-l-blue-500",
    delivered: "border-l-4 border-l-slate-400",
    cancelled: "border-l-4 border-l-rose-500",
};

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.22 } }),
};

function mapClaimStatusToDonationStatus(status: Claim["status"]): DonationStatus {
    switch (status) {
        case "active":
            return DonationStatus.Claimed;
        case "picked_up":
            return DonationStatus.PickedUp;
        case "delivered":
            return DonationStatus.Delivered;
        case "cancelled":
            return DonationStatus.Cancelled;
        default:
            return DonationStatus.Pending;
    }
}

export function ClaimCard({ claim, index = 0, onStatusChange }: ClaimCardProps) {
    const router = useRouter();
    const donation = claim.donation;
    const statusClass = statusAccent[claim.status] ?? "border-l-4 border-l-slate-300";
    const badgeStatus = donation?.status ?? mapClaimStatusToDonationStatus(claim.status);

    // Dialog states
    const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
    const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const handleStatusChangeSuccess = useCallback(() => {
        if (onStatusChange) {
            onStatusChange();
        } else {
            // Fallback: refresh the page data
            router.refresh();
        }
    }, [onStatusChange, router]);

    const pickupCode = useMemo(() => {
        const codeCandidate = [
            donation?.claim && "pickup_code" in (donation.claim as unknown as Record<string, unknown>)
                ? (donation.claim as { pickup_code?: string | number }).pickup_code
                : undefined,
            donation?.pickup_code,
            claim.id,
            donation?.id,
        ].find((value) => value !== null && value !== undefined);

        return String(codeCandidate ?? claim.id).slice(-6).padStart(6, "0");
    }, [claim.id, donation?.claim, donation?.pickup_code, donation?.id]);

    const donorName = donation?.donor && "name" in donation.donor ? String((donation.donor as { name?: string }).name ?? "") : "Donor";
    const donorInitials = donorName ? donorName.slice(0, 2).toUpperCase() : "DN";
    const donorPhone = donation?.donor && "phone" in donation.donor ? (donation.donor as { phone?: string | null }).phone ?? undefined : undefined;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pickupCode);
            toast.success("Pickup code copied");
        } catch {
            toast.error("Unable to copy code");
        }
    };

    const handleNavigate = () => {
        const lat = donation?.latitude;
        const lng = donation?.longitude;
        const address = donation?.pickup_address;

        let url = "";
        if (lat && lng && (lat !== 0 || lng !== 0)) {
            url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        } else if (address) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        }

        if (!url) {
            toast.error("No location data available");
            return;
        }
        window.open(url, "_blank");
    };

    return (
        <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="show"
            whileHover={{ y: -3 }}
        >
            <Card className={cn("h-full overflow-hidden border border-border/70 shadow-sm transition-shadow hover:shadow-md", statusClass)}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                                {donation?.title ?? "Donation"}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {formatQuantity(donation?.quantity)} • {formatFoodType(donation?.food_type)}
                            </p>
                        </div>
                        <StatusBadge status={badgeStatus} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Avatar>
                                <AvatarFallback className="text-xs font-semibold">{donorInitials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium leading-tight">{donorName || "Donor"}</p>
                                <p className="text-xs text-muted-foreground">Donor</p>
                            </div>
                        </div>
                        <Button
                            asChild
                            size="icon-sm"
                            variant="ghost"
                            className="text-primary"
                            disabled={!donorPhone}
                            aria-label="Call donor"
                        >
                            <a href={donorPhone ? `tel:${donorPhone}` : undefined}>
                                <Phone className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>

                    {donation?.pickup_address && (
                        <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-border/80 px-3 py-2">
                            <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                                <div>
                                    <p className="text-sm font-medium leading-tight">Pickup Location</p>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">{donation.pickup_address}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={handleNavigate} className="text-primary">
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Get directions</span>
                            </Button>
                        </div>
                    )}

                    {(claim.status === "active" || claim.status === "picked_up") && (
                        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary/80">Pickup Code</p>
                                <p className="text-2xl font-semibold tracking-[0.3em] text-primary">{pickupCode}</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={handleCopy} aria-label="Copy pickup code">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Mission Complete Badge for delivered claims */}
                    {claim.status === "delivered" && (
                        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">Mission Complete!</p>
                                <p className="text-xs text-emerald-600">
                                    Delivered {claim.delivered_at ? new Date(claim.delivered_at).toLocaleDateString() : ""}
                                </p>
                            </div>
                            <Award className="ml-auto h-5 w-5 text-amber-500" />
                        </div>
                    )}
                </CardContent>

                {/* Smart Footer: Action buttons based on claim status */}
                <CardFooter className="flex flex-col gap-3 border-t pt-4">
                    {/* Primary action buttons */}
                    {claim.status === "active" && (
                        <div className="flex w-full gap-2">
                            <Button
                                onClick={() => setPickupDialogOpen(true)}
                                className="flex-1 bg-primary hover:bg-primary/90"
                            >
                                <PackageCheck className="mr-2 h-4 w-4" />
                                Verify Pickup
                            </Button>
                            <Button
                                onClick={() => setCancelDialogOpen(true)}
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {claim.status === "picked_up" && (
                        <Button
                            onClick={() => setDeliverDialogOpen(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            Confirm Delivery
                        </Button>
                    )}

                    {/* Secondary info row */}
                    <div className="flex w-full items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Updated {new Date(claim.updated_at ?? claim.created_at).toLocaleString()}
                        </p>
                        <Button asChild size="sm" variant="ghost" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                            <Link href={`/donations/${claim.donation_id}`} className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                View Details
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Dialogs */}
            <PickupVerifyDialog
                claimId={claim.id}
                donationTitle={donation?.title}
                open={pickupDialogOpen}
                onOpenChange={setPickupDialogOpen}
                onSuccess={handleStatusChangeSuccess}
            />

            <DeliverConfirmDialog
                claimId={claim.id}
                donationTitle={donation?.title}
                open={deliverDialogOpen}
                onOpenChange={setDeliverDialogOpen}
                onSuccess={handleStatusChangeSuccess}
            />

            <CancelClaimDialog
                claimId={claim.id}
                donationTitle={donation?.title}
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                onSuccess={handleStatusChangeSuccess}
            />
        </motion.div>
    );
}
