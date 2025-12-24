"use client";

import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Donation, DonationStatus } from "@/types/donation";

interface VolunteerInfoProps {
    donation: Donation;
}

export function VolunteerInfo({ donation }: VolunteerInfoProps) {
    if (donation.status !== DonationStatus.Claimed && donation.status !== DonationStatus.PickedUp) {
        return null;
    }

    const volunteer = donation.claim?.volunteer;

    return (
        <Card className="shadow-sm">
            <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase text-muted-foreground">Volunteer</p>
                        <p className="text-base font-semibold text-foreground">{volunteer?.name ?? "Assigned volunteer"}</p>
                        <p className="text-sm text-muted-foreground">Status: {donation.status.replace("_", " ")}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" disabled={!volunteer?.phone}>
                        <Phone className="mr-2 h-4 w-4" aria-hidden /> Call
                    </Button>
                    <Button variant="secondary" className="flex-1">
                        <MessageCircle className="mr-2 h-4 w-4" aria-hidden /> Chat
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}