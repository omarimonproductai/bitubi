import { requireBackofficeUser } from "@/lib/guards";
import { can } from "@/lib/rbac";
import { Sidebar, type NavItem } from "@/components/backoffice/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/app/login/actions";
import { LogOut } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin Cooltra",
  REGION_MANAGER: "Responsable de regió",
  RIDER_MANAGER: "Gestor de riders",
};

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireBackofficeUser();

  const allItems: (NavItem & { perm?: string })[] = [
    { href: "/backoffice", label: "Dashboard", icon: "dashboard" },
    { href: "/backoffice/regions", label: "Regions", icon: "regions", perm: "regions:write" },
    { href: "/backoffice/addresses", label: "Adreces", icon: "addresses", perm: "addresses:write" },
    { href: "/backoffice/motos", label: "Motos", icon: "motos", perm: "motos:write" },
    { href: "/backoffice/clients", label: "Clients", icon: "clients", perm: "clients:write" },
    { href: "/backoffice/riders", label: "Riders", icon: "riders", perm: "riders:write" },
    { href: "/backoffice/assignments", label: "Assignacions", icon: "assignments", perm: "assignments:write" },
    { href: "/backoffice/incidents", label: "Incidències", icon: "incidents", perm: "incidents:write" },
    { href: "/backoffice/tickets-map", label: "Mapa de tickets", icon: "map", perm: "incidents:write" },
    { href: "/backoffice/comms", label: "Comunicació", icon: "comms", perm: "comms:write" },
    { href: "/backoffice/users", label: "Usuaris", icon: "users", perm: "users:write" },
  ];

  const items: NavItem[] = allItems
    .filter((i) => !i.perm || can(user, i.perm))
    .map(({ perm: _perm, ...rest }) => rest);

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="text-base font-semibold">KOMOBI HD Fleet</span>
        </div>
        <Sidebar items={items} />
        <div className="mt-auto border-t p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium">{user.email}</p>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm" className="w-full">
              <LogOut className="size-4" />
              Sortir
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
