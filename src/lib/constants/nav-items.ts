import type { LucideIcon } from "lucide-react";
import { Gift, Home, Map, MapPin, PlusCircle, Search, Truck, User } from "lucide-react";

import { ROLES } from "@/lib/constants";

export type Role = (typeof ROLES)[number];

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  donor: [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "My Donations", href: "/donations", icon: Gift },
    { title: "Create Donation", href: "/donations/create", icon: PlusCircle },
    { title: "Nearby Map", href: "/donations/nearby", icon: Map },
    { title: "Profile", href: "/profile", icon: User },
  ],
  volunteer: [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Nearby Map", href: "/donations/nearby", icon: Map },
    { title: "Browse Donations", href: "/browse", icon: Search },
    { title: "My Claims", href: "/claims", icon: Truck },
    { title: "Profile", href: "/profile", icon: User },
  ],
  recipient: [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Find Food", href: "/donations/nearby", icon: MapPin },
    { title: "Profile", href: "/profile", icon: User },
  ],
};
