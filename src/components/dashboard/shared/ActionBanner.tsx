import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "emerald" | "blue" | "orange" | "slate";

type BannerAction = {
    label: string;
    href?: ComponentProps<typeof Link>["href"];
    variant?: "default" | "outline";
    className?: string;
};

type ActionBannerProps = {
    title: string;
    description: string;
    icon: LucideIcon;
    actions: BannerAction[];
    tone?: Tone;
    className?: string;
};

const toneClasses: Record<
    Tone,
    { card: string; icon: string; primaryButton: string; outlineButton: string }
> = {
    emerald: {
        card: "border-dashed border-2 border-emerald-200 bg-emerald-50/60",
        icon: "bg-emerald-100 text-emerald-700",
        primaryButton: "bg-emerald-600 text-white hover:bg-emerald-700",
        outlineButton: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    },
    blue: {
        card: "border-dashed border-2 border-blue-200 bg-blue-50/60",
        icon: "bg-blue-100 text-blue-700",
        primaryButton: "bg-blue-600 text-white hover:bg-blue-700",
        outlineButton: "border-blue-200 text-blue-700 hover:bg-blue-50",
    },
    orange: {
        card: "border-dashed border-2 border-orange-200 bg-orange-50/60",
        icon: "bg-orange-100 text-orange-700",
        primaryButton: "bg-orange-500 text-white hover:bg-orange-600",
        outlineButton: "border-orange-200 text-orange-700 hover:bg-orange-50",
    },
    slate: {
        card: "border-dashed border-2 border-slate-200 bg-white",
        icon: "bg-slate-100 text-slate-700",
        primaryButton: "bg-slate-800 text-white hover:bg-slate-900",
        outlineButton: "border-slate-200 text-slate-700 hover:bg-slate-50",
    },
};

export function ActionBanner({ title, description, icon: Icon, actions, tone = "slate", className }: ActionBannerProps) {
    const toneClass = toneClasses[tone];

    return (
        <Card className={cn("shadow-sm", toneClass.card, className)}>
            <CardContent className="flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", toneClass.icon)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-slate-900">{title}</p>
                        <p className="text-sm text-slate-600">{description}</p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                    {actions.map((action) => {
                        const isOutline = action.variant === "outline";
                        const classes = isOutline ? toneClass.outlineButton : toneClass.primaryButton;
                        const content = action.href ? <Link href={action.href}>{action.label}</Link> : action.label;

                        return (
                            <Button
                                key={action.label}
                                asChild={Boolean(action.href)}
                                variant={isOutline ? "outline" : "default"}
                                className={cn(classes, action.className)}
                            >
                                {content}
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default ActionBanner;
