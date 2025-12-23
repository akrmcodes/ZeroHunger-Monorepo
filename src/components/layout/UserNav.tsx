"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const getInitials = (name?: string | null) => {
    if (!name) return "ZH";
    const parts = name.trim().split(" ");
    const [first, second] = parts;
    return ((first?.[0] ?? "Z") + (second?.[0] ?? "H")).toUpperCase();
};

export function UserNav() {
    const { user, logout } = useAuth();

    const name = user?.name ?? "ZeroHunger User";
    const email = user?.email ?? "";

    const handleLogout = async () => {
        await logout();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-transparent bg-white px-2 py-1 text-left shadow-sm transition hover:border-emerald-100 hover:shadow">
                <Avatar className="size-9">
                    <AvatarFallback className="bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {getInitials(user?.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    {email && <p className="text-xs text-slate-500">{email}</p>}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{name}</span>
                    {email && <span className="text-xs text-slate-500">{email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={handleLogout}
                    className="text-destructive focus:text-destructive"
                >
                    <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default UserNav;
