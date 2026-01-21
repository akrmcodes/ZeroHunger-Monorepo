"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS, type Role } from "@/lib/constants/nav-items";
import { useAuth } from "@/hooks/useAuth";

const isActivePath = (pathname: string, href: string): boolean => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
};

export function MobileNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const role = (user?.roles?.[0] ?? "donor") as Role;
    const items = NAV_ITEMS[role] ?? [];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
                <div className="flex items-center justify-between pb-2">
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-emerald-700">ZeroHunger</span>
                        <span className="text-xs text-slate-500">Dashboard</span>
                    </div>
                </div>
                <Separator className="my-3" />
                <nav className="space-y-1">
                    {items.map(({ title, href, icon: Icon }) => {
                        const active = isActivePath(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href as any}
                                onClick={() => setOpen(false)}
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
            </SheetContent>
        </Sheet>
    );
}

export default MobileNav;
