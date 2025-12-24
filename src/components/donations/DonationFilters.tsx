"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterStatus = "all" | "active" | "in_progress" | "history";

interface DonationFiltersProps {
    currentTab: FilterStatus;
    onTabChange: (tab: FilterStatus) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const TABS: Array<{ key: FilterStatus; label: string; description?: string }> = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "in_progress", label: "In Progress" },
    { key: "history", label: "History" },
];

export function DonationFilters({ currentTab, onTabChange, searchQuery, onSearchChange }: DonationFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search donations by title"
                        className="pl-9"
                    />
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                    const isActive = tab.key === currentTab;
                    return (
                        <Button
                            key={tab.key}
                            type="button"
                            size="sm"
                            variant={isActive ? "default" : "outline"}
                            className={cn("rounded-full", isActive && "shadow-sm")}
                            onClick={() => onTabChange(tab.key)}
                        >
                            {tab.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
