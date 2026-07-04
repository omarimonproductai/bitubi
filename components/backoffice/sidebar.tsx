"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Building2,
  Bike,
  Briefcase,
  Users,
  ClipboardList,
  AlertTriangle,
  Map as MapIcon,
  Megaphone,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
};

const ICONS = {
  dashboard: LayoutDashboard,
  regions: MapPin,
  addresses: Building2,
  motos: Bike,
  clients: Briefcase,
  riders: Users,
  assignments: ClipboardList,
  incidents: AlertTriangle,
  map: MapIcon,
  comms: Megaphone,
  users: ShieldCheck,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active =
          pathname === item.href ||
          (item.href !== "/backoffice" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
