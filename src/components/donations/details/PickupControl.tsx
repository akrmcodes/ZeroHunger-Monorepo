"use client";

import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes, formatDistanceStrict } from "date-fns";
import { Copy, ExternalLink, Timer } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Donation } from "@/types/donation";

interface PickupControlProps {
    donation: Donation;
}

export function PickupControl({ donation }: PickupControlProps) {
    const [countdown, setCountdown] = useState<string>("");
    const [isCritical, setIsCritical] = useState(false);
    const expiresAt = useMemo(() => new Date(donation.expires_at), [donation.expires_at]);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diffMinutes = differenceInMinutes(expiresAt, now);
            if (diffMinutes <= 0) {
                setCountdown("Expired");
                setIsCritical(true);
                return;
            }
            setCountdown(formatDistanceStrict(expiresAt, now));
            setIsCritical(diffMinutes <= 120);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 30_000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const pickupCode = useMemo(() => {
        const claimPickupCode =
            donation.claim && "pickup_code" in donation.claim
                ? (donation.claim as { pickup_code?: string | number }).pickup_code
                : undefined;

        const codeCandidate = [
            claimPickupCode,
            donation.pickup_code,
            donation.claim?.id,
            donation.id,
        ].find((value) => value !== null && value !== undefined);

        const normalizedCode = String(codeCandidate ?? donation.id);
        return normalizedCode.slice(-6).padStart(6, "0");
    }, [donation.claim, donation.pickup_code, donation.id]);

    const handleNavigate = () => {
        const lat = donation.latitude;
        const lng = donation.longitude;
        const address = donation.pickup_address;

        let url = "";
        if (lat && lng && (lat !== 0 || lng !== 0)) {
            url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        } else if (address) {
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        } else {
            toast.error("No location data available");
            return;
        }
        window.open(url, "_blank");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pickupCode);
        } catch {
            /* noop */
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <Card className="shadow-sm">
                <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Timer className="h-4 w-4" aria-hidden />
                            Expires in
                        </div>
                        <span className={isCritical ? "text-red-600" : "text-emerald-600"}>{countdown}</span>
                    </div>

                    <div className="rounded-lg border border-border/70 bg-card px-4 py-5 text-center">
                        <p className="text-xs uppercase text-muted-foreground">Pickup Code</p>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <span className="text-3xl font-semibold tracking-widest">{pickupCode}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy pickup code">
                                <Copy className="h-4 w-4" aria-hidden />
                            </Button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-linear-to-br from-slate-900 to-slate-700 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]" aria-hidden />
                        <div className="relative space-y-2 p-4">
                            <p className="text-sm font-semibold">Pickup Location</p>
                            <p className="text-xs text-white/80">Lat: {donation.latitude}, Lng: {donation.longitude}</p>
                            <p className="text-xs text-white/70">{donation.pickup_address}</p>
                            <Button size="sm" variant="secondary" className="mt-2 w-max" onClick={handleNavigate}>
                                <span className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" aria-hidden /> Navigate
                                </span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}