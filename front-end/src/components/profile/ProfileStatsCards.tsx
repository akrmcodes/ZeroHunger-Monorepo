"use client";

// Fix Leaflet default marker icons for Next.js
import "@/lib/leaflet-icon-fix";

import { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
    Mail,
    Phone,
    MapPin,
    Package,
    Truck,
    Scale,
    Utensils,
    Clock,
    DollarSign,
    Calendar,
    Zap,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/api";
import {
    getPrimaryRole,
    getSimulatedStats,
    getStatsForDisplay,
} from "@/lib/utils/profile-simulation";

// Dynamic import for the map (SSR disabled)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);

// =============================================================================
// Props
// =============================================================================

interface ProfileStatsCardsProps {
    user: User;
    className?: string;
}

const iconMap = {
    Package,
    Truck,
    Scale,
    Utensils,
    Clock,
    MapPin,
    DollarSign,
    Calendar,
    Zap,
};

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    description?: string;
    iconColor?: string;
    delay?: number;
}

// =============================================================================
// Animation Variants
// =============================================================================

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 25,
            delay: delay * 0.1,
        },
    }),
};

const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
        scale: 1,
        rotate: 0,
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 20,
            delay: 0.2,
        },
    },
};

// =============================================================================
// Mini Stat Card Component
// =============================================================================

function MiniStatCard({
    icon: Icon,
    label,
    value,
    description,
    iconColor = "text-emerald-600",
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            custom={delay}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
        >
            <Card className="h-full border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <motion.div
                            variants={iconVariants}
                            className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                "bg-slate-100"
                            )}
                        >
                            <Icon className={cn("size-5", iconColor)} />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                {label}
                            </p>
                            <p className="mt-1 truncate text-lg font-bold text-slate-900">
                                {value}
                            </p>
                            {description && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// =============================================================================
// Contact Card Component
// =============================================================================

function ContactCard({ user, delay }: { user: User; delay: number }) {
    return (
        <motion.div
            custom={delay}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
        >
            <Card className="h-full border-slate-200/60 shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="size-4 text-slate-500" />
                        Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
                            <Mail className="size-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-500">Email</p>
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {user.email}
                            </p>
                        </div>
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100">
                            <Phone className="size-4 text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-500">Phone</p>
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {user.phone || "Not set"}
                            </p>
                        </div>
                        {user.phone ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : (
                            <XCircle className="size-4 shrink-0 text-slate-300" />
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// =============================================================================
// Location Card Component
// =============================================================================

function LocationCard({
    user,
    delay,
}: {
    user: User;
    delay: number;
}) {
    const hasLocation = user.latitude && user.longitude;

    return (
        <motion.div
            custom={delay}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
        >
            <Card className="h-full border-slate-200/60 shadow-md overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="size-4 text-slate-500" />
                        Your Location
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {hasLocation ? (
                        <div className="relative h-40">
                            <MapContainer
                                key={`${user.latitude}-${user.longitude}`}
                                center={[Number(user.latitude), Number(user.longitude)]}
                                zoom={13}
                                scrollWheelZoom={false}
                                dragging={false}
                                zoomControl={false}
                                attributionControl={false}
                                className="h-full w-full"
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[Number(user.latitude), Number(user.longitude)]} />
                            </MapContainer>
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white/90 to-transparent p-3">
                                <p className="text-xs font-medium text-slate-600">
                                    {Number(user.latitude).toFixed(4)}, {Number(user.longitude).toFixed(4)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center bg-slate-50 text-center p-4">
                            <MapPin className="mb-2 size-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-500">
                                No location set
                            </p>
                            <p className="text-xs text-slate-400">
                                Edit your profile to add a location
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function ProfileStatsCards({ user, className }: ProfileStatsCardsProps) {
    const roleStats = useMemo(() => getSimulatedStats(user), [user]);
    const statCards = useMemo(() => getStatsForDisplay(roleStats), [roleStats]);
    const role = useMemo(() => getPrimaryRole(user), [user]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat, idx) => {
                    const Icon = iconMap[stat.icon];
                    return (
                        <MiniStatCard
                            key={stat.label}
                            icon={Icon}
                            label={stat.label}
                            value={stat.value}
                            description={stat.description}
                            iconColor={stat.iconColor}
                            delay={idx}
                        />
                    );
                })}
            </div>

            {/* Contact & Location Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                <ContactCard user={user} delay={3} />
                <LocationCard user={user} delay={statCards.length >= 3 ? 4 : 2} />
            </div>
        </div>
    );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

export function ProfileStatsCardsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-slate-200/60">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-10 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="border-slate-200/60">
                        <CardHeader className="pb-3">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-32 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default ProfileStatsCards;

