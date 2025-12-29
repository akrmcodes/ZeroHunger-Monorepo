import Link from "next/link";
import { Coffee, MapPin, Milk, Package, Salad, Soup, Wheat } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { Donation, FoodType } from "@/types/donation";

interface DonationCardProps {
    donation: Donation;
    onAction?: (id: number) => void;
    actionLabel?: string;
    /** Distance label to display (e.g., "2.5km") */
    distanceLabel?: string;
    /** Enable shared layout animation with layoutId */
    enableLayoutAnimation?: boolean;
}

const foodIcons: Partial<Record<FoodType, React.ComponentType<{ className?: string }>>> = {
    [FoodType.CookedMeal]: Soup,
    [FoodType.Groceries]: Package,
    [FoodType.Bakery]: Wheat,
    [FoodType.Vegetables]: Salad,
    [FoodType.Canned]: Package,
    [FoodType.Dairy]: Milk,
    [FoodType.Beverages]: Coffee,
    [FoodType.Other]: Package,
};

export function DonationCard({
    donation,
    onAction,
    actionLabel = "View details",
    distanceLabel,
    enableLayoutAnimation = false
}: DonationCardProps) {
    const Icon = donation.food_type ? (foodIcons[donation.food_type as FoodType] ?? Package) : Package;
    const expiresIn = donation.expires_at
        ? formatDistanceToNowStrict(new Date(donation.expires_at), { addSuffix: true })
        : "No expiry";

    return (
        <AnimatedCard
            layoutId={enableLayoutAnimation ? `donation-card-${donation.id}` : undefined}
            layout={enableLayoutAnimation ? "position" : false}
            hoverLift={6}
            hoverScale={1.02}
            enableGlow
            className="h-full"
        >
            <Card className="relative h-full overflow-hidden border border-border/60 shadow-sm">
                {/* Distance badge - appears when provided */}
                {distanceLabel && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground shadow">
                            <MapPin className="h-3 w-3" />
                            {distanceLabel}
                        </span>
                    </div>
                )}

                <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                            <CardTitle className="line-clamp-1 text-base font-semibold leading-tight">
                                {donation.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">{donation.quantity} kg • {donation.food_type}</p>
                        </div>
                    </div>
                    <StatusBadge status={donation.status} />
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {donation.pickup_address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                            <p className="line-clamp-2">{donation.pickup_address}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1 text-secondary-foreground">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                            Expires {expiresIn}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                        Created {formatDistanceToNowStrict(new Date(donation.created_at), { addSuffix: true })}
                    </div>
                    <MagneticButton
                        asChild
                        size="sm"
                        variant="outline"
                        magneticStrength={0.25}
                    >
                        <Link
                            href={`/donations/${donation.id}`}
                            onClick={() => onAction?.(donation.id)}
                            aria-label={`Manage donation ${donation.title}`}
                        >
                            {actionLabel}
                        </Link>
                    </MagneticButton>
                </CardFooter>
            </Card>
        </AnimatedCard>
    );
}
