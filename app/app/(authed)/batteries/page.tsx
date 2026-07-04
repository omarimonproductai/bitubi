import { requireRider } from "@/lib/guards";
import { db } from "@/lib/db";
import { googleMapsLatLng } from "@/lib/maps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BatteryCharging, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BatteriesPage() {
  await requireRider();
  const stations = await db.batteryStation.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Estacions de bateries</CardTitle>
          <CardDescription>
            Bateries amb més del 80% de càrrega per estació.
          </CardDescription>
        </CardHeader>
      </Card>

      {stations.length === 0 ? (
        <p className="text-muted-foreground text-sm">Cap estació disponible.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {stations.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground text-xs">{s.address}</p>
                  <Badge variant="secondary" className="mt-1 w-fit">
                    <BatteryCharging className="size-3" />
                    {s.batteriesAbove80} bateries &gt;80%
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={googleMapsLatLng(s.lat, s.lng)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin className="size-4" />
                    Maps
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
