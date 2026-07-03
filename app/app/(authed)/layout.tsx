import { requireRider } from "@/lib/guards";
import { BottomNav } from "@/components/rider/bottom-nav";
import { Button } from "@/components/ui/button";
import { logoutRider } from "../actions";
import { LogOut } from "lucide-react";

export default async function RiderAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rider = await requireRider();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">KOMOBI</p>
          <p className="text-muted-foreground text-xs">{rider.email}</p>
        </div>
        <form action={logoutRider}>
          <Button variant="ghost" size="icon" aria-label="Sortir">
            <LogOut className="size-4" />
          </Button>
        </form>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <BottomNav />
    </div>
  );
}
