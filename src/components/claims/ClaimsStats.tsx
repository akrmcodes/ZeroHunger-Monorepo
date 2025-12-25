"use client";

import { motion } from "framer-motion";
import { Activity, Award, Rocket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClaimsStatsProps {
    total: number;
    active: number;
    impactScore: number;
}

const statsConfig: { key: keyof ClaimsStatsProps; label: string; Icon: typeof Activity; accent: string }[] = [
    { key: "total", label: "Total Claims", Icon: Rocket, accent: "from-violet-500/80 to-purple-500/80" },
    { key: "active", label: "Active Missions", Icon: Activity, accent: "from-emerald-500/80 to-teal-500/70" },
    { key: "impactScore", label: "Impact Score", Icon: Award, accent: "from-blue-500/80 to-indigo-500/70" },
];

export function ClaimsStats({ total, active, impactScore }: ClaimsStatsProps) {
    const values: ClaimsStatsProps = { total, active, impactScore };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statsConfig.map((stat, idx) => (
                <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                >
                    <Card className="relative overflow-hidden border border-border/70 shadow-sm">
                        <div className={cn("absolute inset-0 bg-linear-to-r opacity-20", stat.accent)} aria-hidden />
                        <CardHeader className="relative pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <stat.Icon className="h-4 w-4" />
                                {stat.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative pt-0">
                            <p className="text-3xl font-bold text-foreground">{values[stat.key].toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Updated live</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
