"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { NAV_ITEMS, type Role } from "@/lib/constants/nav-items";
import { useAuth } from "@/hooks/useAuth";

const isActivePath = (pathname: string, href: string): boolean => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
};

export function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();

    const role = (user?.roles?.[0] ?? "donor") as Role;
    const items = NAV_ITEMS[role] ?? [];

    return (
        <aside className="hidden w-64 shrink-0 border-r bg-white/90 px-4 py-6 shadow-sm lg:block">
            {/* Logo / Brand with Home Link */}
            <Link
                href="/"
                className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
                <span className="text-lg">🌱</span>
                <span>ZeroHunger</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
            </Link>
            <div className="mb-4 h-px bg-border" />
            <div className="mb-6 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Navigation</div>
            <nav className="space-y-1">
                {items.map(({ title, href, icon: Icon }) => {
                    const active = isActivePath(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={
                                active
                                    ? "flex items-center gap-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow"
                                    : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {title}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;
