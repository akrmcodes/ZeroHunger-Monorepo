import { MapPin, Package, Salad, Soup, Wheat } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/donations/StatusBadge";
import { Donation, FoodType } from "@/types/donation";
import { cn } from "@/lib/utils";

interface DonationCardProps {
    donation: Donation;
    onAction?: (id: number) => void;
    actionLabel?: string;
}

const foodIcons: Record<FoodType, React.ComponentType<{ className?: string }>> = {
    [FoodType.CookedMeal]: Soup,
    [FoodType.Groceries]: Package,
    [FoodType.Bakery]: Wheat,
    [FoodType.Vegetables]: Salad,
    [FoodType.Canned]: Package,
};

export function DonationCard({ donation, onAction, actionLabel = "View details" }: DonationCardProps) {
    const Icon = donation.food_type ? foodIcons[donation.food_type] : Package;
    const expiresIn = donation.expires_at
        ? formatDistanceToNowStrict(new Date(donation.expires_at), { addSuffix: true })
        : "No expiry";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <Card className="relative overflow-hidden border border-border/60 shadow-sm">
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
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction?.(donation.id)}
                    >
                        {actionLabel}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
