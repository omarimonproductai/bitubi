import { requireRider } from "@/lib/guards";
import {
  getActiveAssignment,
  getSubstitutionMotos,
} from "@/lib/services/rider";
import { InlineAction } from "@/components/backoffice/inline-action";
import { selfAssignAction } from "../../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SubstitutionPage() {
  const rider = await requireRider();
  const [assignment, subs] = await Promise.all([
    getActiveAssignment(rider.id),
    getSubstitutionMotos(rider.id),
  ]);

  const hasLinked = assignment?.status === "LINKED";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Vehicles de substitució</CardTitle>
          <CardDescription>
            Del teu client i regió. Només pots auto-assignar-te&apos;n un si no
            tens cap vehicle vinculat.
          </CardDescription>
        </CardHeader>
      </Card>

      {hasLinked && (
        <div className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
          Tens un vehicle vinculat: no pots agafar un vehicle de substitució.
          Deixa el vehicle abans.
        </div>
      )}

      {subs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ara mateix no hi ha vehicles de substitució disponibles.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {subs.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-mono text-lg font-semibold">
                    {s.moto.plate}
                  </p>
                  <p className="text-muted-foreground text-xs">Substitució</p>
                </div>
                {!hasLinked && (
                  <InlineAction
                    action={selfAssignAction.bind(null, s.motoId)}
                    variant="default"
                  >
                    Auto-assignar
                  </InlineAction>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
