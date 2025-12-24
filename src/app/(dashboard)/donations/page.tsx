"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DonationFilters } from "@/components/donations/DonationFilters";
import { DonationGrid } from "@/components/donations/DonationGrid";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Donation, DonationStatus } from "@/types/donation";

export default function Page() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<"all" | "active" | "in_progress" | "history">("all");
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        let isMounted = true;

        const fetchDonations = async () => {
            try {
                const response = await api.donations.myDonations();
                if (!isMounted) return;
                setDonations(response.data);
            } catch (error: unknown) {
                if (!isMounted) return;
                const message = error instanceof Error ? error.message : "Failed to load donations";
                toast.error(message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void fetchDonations();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredDonations = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const statusMap: Record<typeof filter, DonationStatus[]> = {
            all: [],
            active: ["pending"] as DonationStatus[],
            in_progress: ["claimed", "picked_up"] as DonationStatus[],
            history: ["delivered", "expired"] as DonationStatus[],
        };

        return donations.filter((donation) => {
            const matchesSearch = normalizedSearch
                ? donation.title.toLowerCase().includes(normalizedSearch)
                : true;
            const allowedStatuses = statusMap[filter];
            const matchesStatus = allowedStatuses.length ? allowedStatuses.includes(donation.status) : true;
            return matchesSearch && matchesStatus;
        });
    }, [donations, filter, search]);

    return (
        <div className="space-y-6 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">My Donations</h1>
                    <p className="text-sm text-muted-foreground">Manage your active and past donations.</p>
                </div>
                <Button asChild size="sm" className="gap-2">
                    <Link href="/donations/create">
                        <Plus className="h-4 w-4" aria-hidden />
                        New Donation
                    </Link>
                </Button>
            </div>

            <DonationFilters
                currentTab={filter}
                onTabChange={setFilter}
                searchQuery={search}
                onSearchChange={setSearch}
            />

            <DonationGrid donations={filteredDonations} isLoading={loading} />
        </div>
    );
}
