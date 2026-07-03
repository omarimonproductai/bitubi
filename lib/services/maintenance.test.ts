import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { recalculateMaintenance } from "./maintenance";

const db = new PrismaClient();
const P = `TEST_MNT_${Date.now()}_`;
let regionId: string;
let motoId: string;

before(async () => {
  const region = await db.region.create({ data: { name: `${P}R` } });
  regionId = region.id;
  const moto = await db.moto.create({ data: { plate: `${P}1`, regionId } });
  motoId = moto.id;
});

after(async () => {
  await db.maintenancePlan.deleteMany({ where: { motoId } });
  await db.moto.deleteMany({ where: { plate: { startsWith: P } } });
  await db.region.deleteMany({ where: { name: { startsWith: P } } });
  await db.$disconnect();
});

test("recalculateMaintenance sets next maintenance to km + interval", async () => {
  const plan = await recalculateMaintenance(motoId, 9200);
  assert.equal(plan.currentKm, 9200);
  assert.equal(plan.nextMaintenanceKm, 19200);
});

test("recalculateMaintenance updates an existing plan", async () => {
  const plan = await recalculateMaintenance(motoId, 21000);
  assert.equal(plan.currentKm, 21000);
  assert.equal(plan.nextMaintenanceKm, 31000);
});
