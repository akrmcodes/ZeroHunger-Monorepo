import type { ReactNode } from "react";

import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/20">
            <div className="mx-auto flex w-full max-w-7xl gap-0 px-4">
                <Sidebar />
                <div className="flex min-h-screen flex-1 flex-col">
                    <DashboardNavbar />
                    <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
