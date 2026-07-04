"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertTriangle, Repeat, BatteryCharging } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app", label: "Inici", icon: Home },
  { href: "/app/incident", label: "Incidència", icon: AlertTriangle },
  { href: "/app/substitution", label: "Substitució", icon: Repeat },
  { href: "/app/batteries", label: "Bateries", icon: BatteryCharging },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-background sticky bottom-0 z-10 grid grid-cols-4 border-t">
      {ITEMS.map((it) => {
        const active = pathname === it.href;
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs",
              active ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
