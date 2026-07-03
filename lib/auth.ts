import { cookies } from "next/headers";
import { randomBytes, randomInt } from "crypto";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import type { UserType, Role } from "@prisma/client";

const SESSION_COOKIE = "komobi_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dies

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  hashed: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/** Password aleatori que el gestor genera per a un rider. */
export function generateRandomPassword(length = 10): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Codi de 5 dígits per a l'obertura de seient d'un vehicle de substitució. */
export function generateSeatCode(): string {
  return String(randomInt(0, 100000)).padStart(5, "0");
}

export async function createSession(userType: UserType, userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { token, userType, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    store.delete(SESSION_COOKIE);
  }
}

type SessionInfo = { userType: UserType; userId: string };

export async function getSession(): Promise<SessionInfo | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({ where: { token } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.deleteMany({ where: { token } });
    return null;
  }
  return { userType: session.userType, userId: session.userId };
}

export async function getCurrentBackofficeUser() {
  const session = await getSession();
  if (!session || session.userType !== "BACKOFFICE") return null;
  return db.backofficeUser.findUnique({ where: { id: session.userId } });
}

export async function getCurrentRider() {
  const session = await getSession();
  if (!session || session.userType !== "RIDER") return null;
  return db.rider.findUnique({
    where: { id: session.userId },
    include: { client: true, region: true },
  });
}

export type { Role };
