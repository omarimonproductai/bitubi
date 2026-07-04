import { redirect } from "next/navigation";
import { getCurrentBackofficeUser, getCurrentRider } from "@/lib/auth";
import { can } from "@/lib/rbac";

/** Redirigeix a /login si no hi ha usuari de backoffice autenticat. */
export async function requireBackofficeUser() {
  const user = await getCurrentBackofficeUser();
  if (!user) redirect("/login");
  return user;
}

/** Requereix un permís concret; si no, redirigeix al dashboard. */
export async function requirePermission(permission: string) {
  const user = await requireBackofficeUser();
  if (!can(user, permission)) redirect("/backoffice");
  return user;
}

/** Redirigeix a /app/login si no hi ha rider autenticat. */
export async function requireRider() {
  const rider = await getCurrentRider();
  if (!rider) redirect("/app/login");
  return rider;
}
