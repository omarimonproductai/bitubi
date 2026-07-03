import type { BackofficeUser, Role } from "@prisma/client";

/** Permisos per rol de backoffice. */
export const PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "regions:write",
    "addresses:write",
    "motos:write",
    "clients:write",
    "riders:write",
    "assignments:write",
    "incidents:write",
    "users:write",
    "comms:write",
  ],
  REGION_MANAGER: [
    "assignments:write",
    "incidents:write",
    "motos:write",
    "comms:write",
  ],
  RIDER_MANAGER: ["riders:write"],
};

export function can(user: BackofficeUser | null, permission: string): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Un REGION_MANAGER només pot operar sobre la seva regió.
 * ADMIN i RIDER_MANAGER no estan limitats per regió.
 */
export function canAccessRegion(
  user: BackofficeUser | null,
  regionId: string
): boolean {
  if (!user) return false;
  if (user.role === "REGION_MANAGER") return user.regionId === regionId;
  return true;
}
