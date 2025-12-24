import { type LucideIcon } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "emerald" | "blue" | "orange" | "slate";

type StatCardProps = {
    title: string;
    value: string;
    helper?: string;
    icon?: LucideIcon;
    iconBackground?: string;
    badgeText?: string;
    badgeClassName?: string;
    endAddon?: React.ReactNode;
    tone?: Tone;
    className?: string;
};

const toneClasses: Record<Tone, { card: string; icon: string; badge: string }> = {
    emerald: {
        card: "border-emerald-100/70 bg-white/90",
        icon: "bg-emerald-100 text-emerald-700",
        badge: "bg-emerald-100 text-emerald-800",
    },
    blue: {
        card: "border-blue-100/70 bg-white/90",
        icon: "bg-blue-100 text-blue-700",
        badge: "bg-blue-100 text-blue-800",
    },
    orange: {
        card: "border-orange-100/70 bg-white/90",
        icon: "bg-orange-100 text-orange-700",
        badge: "bg-orange-100 text-orange-800",
    },
    slate: {
        card: "border-slate-100 bg-white",
        icon: "bg-slate-100 text-slate-700",
        badge: "bg-slate-100 text-slate-700",
    },
};

export function StatCard({
    title,
    value,
    helper,
    icon: Icon,
    iconBackground,
    badgeText,
    badgeClassName,
    endAddon,
    tone = "slate",
    className,
}: StatCardProps) {
    const toneClass = toneClasses[tone];
    const showAside = Boolean(badgeText || endAddon);

    return (
        <Card className={cn("h-full shadow-sm backdrop-blur", toneClass.card, className)}>
            <CardHeader className="flex flex-row items-start gap-3">
                {Icon && (
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", toneClass.icon, iconBackground)}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-sm font-semibold text-slate-600">{title}</CardTitle>
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        {helper && <p className="text-sm text-slate-600">{helper}</p>}
                    </div>
                    {showAside && (
                        <div className="flex flex-col items-end gap-2">
                            {badgeText && (
                                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", toneClass.badge, badgeClassName)}>
                                    {badgeText}
                                </span>
                            )}
                            {endAddon}
                        </div>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}

export default StatCard;
