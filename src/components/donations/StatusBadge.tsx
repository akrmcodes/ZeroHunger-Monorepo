import { BadgeCheck, Ban, Clock, FlagTriangleRight, PackageCheck, ShieldAlert } from "lucide-react";
import { DonationStatus } from "@/types/donation";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: DonationStatus | string;
    className?: string;
}

type Variant = { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> };

const STATUS_STYLES: Record<DonationStatus, Variant> = {
    [DonationStatus.Pending]: {
        bg: "bg-amber-100",
        text: "text-amber-800",
        Icon: Clock,
    },
    [DonationStatus.Claimed]: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        Icon: FlagTriangleRight,
    },
    [DonationStatus.PickedUp]: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        Icon: PackageCheck,
    },
    [DonationStatus.Delivered]: {
        bg: "bg-green-100",
        text: "text-green-800",
        Icon: BadgeCheck,
    },
    [DonationStatus.Expired]: {
        bg: "bg-neutral-100",
        text: "text-neutral-800",
        Icon: ShieldAlert,
    },
    [DonationStatus.Cancelled]: {
        bg: "bg-red-100",
        text: "text-red-800",
        Icon: Ban,
    },
};

const FALLBACK_VARIANT: Variant = {
    bg: "bg-slate-100",
    text: "text-slate-700",
    Icon: ShieldAlert,
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "";
    const variant = STATUS_STYLES[normalizedStatus as DonationStatus] ?? FALLBACK_VARIANT;

    if (variant === FALLBACK_VARIANT) {
        console.warn("Unknown status:", status);
    }

    const label = normalizedStatus ? normalizedStatus.replace("_", " ") : "unknown";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                variant.bg,
                variant.text,
                className
            )}
        >
            <variant.Icon className="h-3 w-3" aria-hidden />
            <span className="capitalize">{label}</span>
        </span>
    );
}
