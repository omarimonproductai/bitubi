import Link from "next/link";
import { requireRider } from "@/lib/guards";
import { db } from "@/lib/db";
import { getActiveAssignment, isMotoBlocked } from "@/lib/services/rider";
import { InlineAction } from "@/components/backoffice/inline-action";
import { OpenSeatForm } from "@/components/rider/open-seat-form";
import { leaveVehicleAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RiderHome() {
  const rider = await requireRider();
  const assignment = await getActiveAssignment(rider.id);

  const notifications = await db.notification.findMany({
    where: { riderId: rider.id, readAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const isSub = assignment?.moto.clientAssignments[0]?.isSubstitution ?? false;
  const blocked = assignment ? await isMotoBlocked(assignment.motoId) : false;
  const address = assignment?.moto.region.addresses.find(
    (a) => a.status === "ACTIVE"
  );

  return (
    <div className="flex flex-col gap-4">
      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-primary/10 text-primary rounded-md px-3 py-2 text-sm"
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

      {!assignment && (
        <Card>
          <CardHeader>
            <CardTitle>Sense vehicle</CardTitle>
            <CardDescription>
              Encara no tens cap vehicle assignat. Si t&apos;han assignat un
              vehicle de substitució, ves a la pestanya Substitució.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app/substitution">Veure substitució</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {assignment?.status === "RECEPTION" && (
        <Card>
          <CardHeader>
            <CardTitle>Recepció del vehicle</CardTitle>
            <CardDescription>
              Encara no està vinculat. Cooltra el vincularà quan el recullis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Vehicle: </span>
              <span className="font-mono font-medium">{assignment.moto.plate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">On anar: </span>
              {address ? (
                <span>
                  {address.name} — {address.street}, {address.postcode}{" "}
                  {address.city}
                </span>
              ) : (
                <span>{assignment.moto.region.name}</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Hora: </span>
              {assignment.receptionAt.toLocaleString("ca-ES")}
            </div>
            <div>
              <span className="text-muted-foreground">Documentació: </span>
              Porta el teu DNI/NIE i el contracte amb el client.
            </div>
          </CardContent>
        </Card>
      )}

      {assignment?.status === "LINKED" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vehicle vinculat</CardTitle>
                {isSub && <Badge variant="outline">Substitució</Badge>}
              </div>
              <CardDescription>
                {assignment.moto.region.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="text-center">
                <p className="font-mono text-3xl font-bold">
                  {assignment.moto.plate}
                </p>
              </div>
              {blocked && (
                <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                  Aquest vehicle està bloquejat per una incidència. Pots agafar un
                  vehicle de substitució.
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href="/app/incident">Reportar incidència</Link>
                </Button>
                <InlineAction action={leaveVehicleAction} variant="destructive">
                  Deixar el vehicle
                </InlineAction>
              </div>
            </CardContent>
          </Card>

          {isSub && (
            <Card>
              <CardHeader>
                <CardTitle>Obrir seient</CardTitle>
                <CardDescription>
                  Introdueix el codi de 5 dígits per obrir el seient.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpenSeatForm />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
