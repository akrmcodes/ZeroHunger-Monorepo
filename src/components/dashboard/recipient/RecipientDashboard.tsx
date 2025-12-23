"use client";

import { motion } from "framer-motion";
import { MapPin, ShoppingBag, Soup, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from "recharts";

import { StatCard } from "@/components/dashboard/shared/StatCard";
import { containerVariants, itemVariants } from "@/components/dashboard/shared/variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
    { title: "Nearby Donations", value: "8", icon: MapPin },
    { title: "My Orders", value: "2", icon: ShoppingBag },
];

const nearbyItems = [
    { name: "Fresh Bread", place: "Sunrise Bakery", distance: "0.5 km" },
    { name: "Vegetable Box", place: "Green Market", distance: "1.1 km" },
    { name: "Hot Meals", place: "Community Kitchen", distance: "1.4 km" },
];

const mealsData = [
    { day: "Mon", meals: 1 },
    { day: "Tue", meals: 0 },
    { day: "Wed", meals: 2 },
    { day: "Thu", meals: 1 },
    { day: "Fri", meals: 3 },
    { day: "Sat", meals: 1 },
    { day: "Sun", meals: 2 },
];

type StatusTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{ payload?: { day?: string; meals?: number } }>;
    label?: string | number;
};

function StatusTooltip({ active, payload }: StatusTooltipProps) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
            <p className="font-semibold text-slate-900">{point.day}</p>
            <p className="text-slate-600">{point.meals ?? 0} meals received</p>
        </div>
    );
}

export function RecipientDashboard() {
    const hasNearby = nearbyItems.length > 0;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="rounded-2xl bg-gradient-to-r from-orange-100 via-white to-orange-50 p-5 shadow-sm ring-1 ring-orange-100/60">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">ZeroHunger</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Find food nearby</h2>
                <p className="text-sm text-slate-700">Safe, dignified access to surplus food in your area.</p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
                {stats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            iconBackground="bg-orange-100 text-orange-700"
                            tone="orange"
                        />
                    </motion.div>
                ))}
            </div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardHeader>
                        <CardTitle>Nearby Available Food</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasNearby ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {nearbyItems.map((item) => (
                                    <div key={item.name} className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-base font-semibold text-slate-900">{item.name}</p>
                                                <p className="text-sm text-slate-700">{item.place}</p>
                                                <p className="text-xs text-orange-700">{item.distance} away</p>
                                            </div>
                                            <Soup className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div className="mt-3">
                                            <Button className="w-full bg-orange-500 hover:bg-orange-600">Reserve</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/60 p-4 text-center text-sm text-slate-600">
                                No donations nearby yet. We&apos;ll notify you.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                                <UtensilsCrossed className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-900">View all on map</p>
                                <p className="text-sm text-slate-600">See every available donation pinned nearby.</p>
                            </div>
                        </div>
                        <Button asChild className="bg-orange-500 px-5 hover:bg-orange-600">
                            <Link href="/donations/nearby">Open Map</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="border-orange-100/80 bg-white/95 shadow-sm">
                    <CardHeader>
                        <CardTitle>Meals Received (Last 7 days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mealsData}>
                                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                                <Tooltip content={<StatusTooltip />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
                                <Bar dataKey="meals" radius={[8, 8, 4, 4]} fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

export default RecipientDashboard;
