"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MobileNav } from "@/components/layout/MobileNav";
import { UserNav } from "@/components/layout/UserNav";

const buildBreadcrumbs = (pathname: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [] as { label: string; href: string }[];

    // Ensure dashboard base
    if (segments[0] !== "dashboard") {
        crumbs.push({ label: "Dashboard", href: "/dashboard" });
    }

    let cumulative = "";
    segments.forEach((segment, index) => {
        cumulative += `/${segment}`;
        const label = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        crumbs.push({ label: label.trim(), href: cumulative });
    });

    return crumbs;
};

export function DashboardNavbar() {
    const pathname = usePathname();
    const crumbs = buildBreadcrumbs(pathname);

    return (
        <header className="flex items-center justify-between gap-4 border-b bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
                <MobileNav />
                <Breadcrumb>
                    <BreadcrumbList>
                        {crumbs.map((crumb, index) => {
                            const isLast = index === crumbs.length - 1;
                            return (
                                <span key={crumb.href} className="flex items-center">
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </span>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <UserNav />
        </header>
    );
}

export default DashboardNavbar;
