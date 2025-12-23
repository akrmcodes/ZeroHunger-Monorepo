"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DonorDashboard from "@/components/dashboard/donor/DonorDashboard";
import VolunteerDashboard from "@/components/dashboard/volunteer/VolunteerDashboard";
import RecipientDashboard from "@/components/dashboard/recipient/RecipientDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const roleBadgeClasses: Record<string, string> = {
    donor: "bg-emerald-100 text-emerald-800",
    volunteer: "bg-blue-100 text-blue-800",
    recipient: "bg-orange-100 text-orange-800",
};

export default function DashboardPage() {
    const { user } = useAuth();
    const { role, isDonor, isVolunteer, isRecipient } = useUserRole();

    const name = user?.name ?? "there";
    const badgeClass = role ? roleBadgeClasses[role] ?? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <p className="text-sm text-slate-600">Welcome back,</p>
                    <h1 className="text-2xl font-bold text-slate-900">{name}!</h1>
                </div>
                {role && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{role}</span>}
            </div>

            {isDonor && <DonorDashboard />}

            {isVolunteer && <VolunteerDashboard />}

            {isRecipient && <RecipientDashboard />}

            {!isDonor && !isVolunteer && !isRecipient && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select a role</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <p className="text-slate-700">Choose your role to see tailored actions.</p>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <Link href="/profile">Go to Profile</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
