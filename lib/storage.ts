import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Desa una foto d'incidència a public/uploads i retorna la seva URL pública.
 * v1 local; en producció es substituiria per S3 amb URL signada.
 */
export async function saveUploadedPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}
