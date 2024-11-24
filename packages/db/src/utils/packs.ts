import schema from "../main/schema";
import { and, eq } from "drizzle-orm";
import { db } from "../connectors/pool";
import { getMinigamesByIdsPublic } from "./minigames";
import type { Pack } from "@/public";

export async function createPack(pack: typeof schema.packs.$inferInsert) {
  return (await db.insert(schema.packs).values(pack).returning({ id: schema.packs.id }))[0].id;
}

export async function updatePack(pack: Partial<typeof schema.packs.$inferSelect> & { id: string }) {
  await db.update(schema.packs).set(pack).where(eq(schema.packs.id, pack.id));
}

export async function deletePack(id: string) {
  await db.delete(schema.packs).where(eq(schema.packs.id, id));
}

export function addMinigameToPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return db.insert(schema.packsMinigames).values({ packId, minigameId });
}

export function removeMinigameFromPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return db
    .delete(schema.packsMinigames)
    .where(and(eq(schema.packsMinigames.packId, packId), eq(schema.packsMinigames.minigameId, minigameId)));
}

export async function getPack(id: string) {
  return db.query.packs.findFirst({
    where: eq(schema.packs.id, id),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
}

export function getPackMinigames({ id, offset = 0, limit = 50 }: { id: string; offset?: number; limit?: number }) {
  return db.query.packsMinigames.findMany({
    offset,
    limit,
    where: eq(schema.packsMinigames.packId, id),
  });
}

export function getPackMinigameCount(id: string) {
  return db.$count(schema.packsMinigames, eq(schema.packsMinigames.packId, id));
}

export async function getPackPublic({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }): Promise<Pack | null> {
  const pack = await getPack(id);
  if (!pack) return null;

  const { offset: actualOffset, limit: actualLimit, total, minigames } = await getPackMinigamesPublic({ id, offset, limit });
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    publishType: pack.publishType,
    author: {
      id: pack.author.id,
      name: pack.author.name,
      createdAt: pack.author.createdAt.toString(),
    },
    iconImage:
      pack.iconImage && pack.iconPlaceholderImage
        ? {
            url: pack.iconImage,
            placeholder: pack.iconPlaceholderImage,
          }
        : null,
    minigames: {
      data: minigames,
      offset: actualOffset,
      limit: actualLimit,
      total,
    },
    createdAt: pack.createdAt.toString(),
  };
}

export async function getPackMinigamesPublic({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }) {
  const minigameIds = await getPackMinigames({ id, offset, limit });
  return {
    id,
    offset,
    limit,
    total: await getPackMinigameCount(id),
    minigames: await getMinigamesByIdsPublic(minigameIds.map((m) => m.minigameId)),
  };
}

export async function isMinigameInPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return !!(await db.query.packsMinigames.findFirst({
    where: and(eq(schema.packsMinigames.packId, packId), eq(schema.packsMinigames.minigameId, minigameId)),
  }));
}
