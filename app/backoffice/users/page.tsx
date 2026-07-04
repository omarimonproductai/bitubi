import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { UserDialog } from "@/components/backoffice/user-dialog";
import { InlineAction } from "@/components/backoffice/inline-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, updateUser, toggleUserStatus } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin Cooltra",
  REGION_MANAGER: "Responsable de regió",
  RIDER_MANAGER: "Gestor de riders",
};

export default async function UsersPage() {
  await requirePermission("users:write");

  const [users, regions] = await Promise.all([
    db.backofficeUser.findMany({
      include: { region: true },
      orderBy: { email: "asc" },
    }),
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const regionOpts = regions.map((r) => ({ id: r.id, name: r.name }));

  return (
    <>
      <PageHeader
        title="Usuaris"
        description="Roster d'usuaris de backoffice i els seus rols"
      >
        <UserDialog mode="create" regions={regionOpts} action={createUser} />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const active = u.status === "ACTIVE";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell>{u.region?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Actiu" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <UserDialog
                          mode="edit"
                          user={{
                            id: u.id,
                            email: u.email,
                            role: u.role,
                            regionId: u.regionId,
                          }}
                          regions={regionOpts}
                          action={updateUser}
                        />
                        <InlineAction action={toggleUserStatus.bind(null, u.id, !active)}>
                          {active ? "Donar de baixa" : "Reactivar"}
                        </InlineAction>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
