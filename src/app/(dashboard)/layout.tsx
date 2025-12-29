import type { ReactNode } from "react";

import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SkipLink } from "@/components/ui/skip-link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/20 overflow-x-hidden">
            {/* Accessible skip link for keyboard users */}
            <SkipLink />

            <div className="mx-auto flex w-full max-w-7xl gap-0 px-4 overflow-x-hidden">
                <Sidebar />
                <div className="flex min-h-screen flex-1 flex-col">
                    <DashboardNavbar />
                    <main
                        id="main-content"
                        tabIndex={-1}
                        className="flex-1 px-4 py-6 lg:px-8 outline-none"
                    >
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
