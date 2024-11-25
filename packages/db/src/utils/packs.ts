import env from "@/env";
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

export async function updatePackWithAuthorId(
  pack: Partial<typeof schema.packs.$inferSelect> & { id: string; authorId: string },
) {
  await db
    .update(schema.packs)
    .set(pack)
    .where(and(eq(schema.packs.id, pack.id), eq(schema.packs.authorId, pack.authorId)));
}

export async function deletePack(id: string) {
  await db.delete(schema.packs).where(eq(schema.packs.id, id));
}

export async function deletePackWithAuthorId({ id, authorId }: { id: string; authorId: string }) {
  await db.delete(schema.packs).where(and(eq(schema.packs.id, id), eq(schema.packs.authorId, authorId)));
}

export function getMinigameInPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return db.query.packsMinigames.findFirst({
    where: and(eq(schema.packsMinigames.packId, packId), eq(schema.packsMinigames.minigameId, minigameId)),
  });
}

export function addMinigameToPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return db.insert(schema.packsMinigames).values({ packId, minigameId });
}

export function removeMinigameFromPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return db
    .delete(schema.packsMinigames)
    .where(and(eq(schema.packsMinigames.packId, packId), eq(schema.packsMinigames.minigameId, minigameId)));
}

export async function getPacksByAuthorId({
  authorId,
  offset = 0,
  limit = 50,
}: { authorId: string; offset?: number; limit?: number }) {
  const packs = await db.query.packs.findMany({
    offset,
    limit,
    where: eq(schema.packs.authorId, authorId),
  });
  return {
    offset,
    limit,
    total: await getPackCountByAuthorId(authorId),
    packs,
  };
}

export function getPackCountByAuthorId(authorId: string) {
  return db.$count(schema.packs, eq(schema.packs.authorId, authorId));
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

export async function getPackByAuthorId({ id, authorId }: { id: string; authorId: string }) {
  return db.query.packs.findFirst({
    where: and(eq(schema.packs.id, id), eq(schema.packs.authorId, authorId)),
  });
}

export function getPackMinigames({ id, offset = 0, limit = 50 }: { id: string; offset?: number; limit?: number }) {
  return db.query.packsMinigames.findMany({
    offset,
    limit,
    where: eq(schema.packsMinigames.packId, id),
  });
}

export function getPackMinigamesByAuthorId({ id, offset = 0, limit = 50 }: { id: string; offset?: number; limit?: number }) {
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

  const minigamesPublic = await getPackMinigamesPublic({ id, offset, limit });
  return transformPackToPackPublic({ pack, minigamesPublic });
}

export async function getPackMinigamesPublic({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }) {
  const minigameIds = await getPackMinigames({ id, offset, limit });
  return {
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

function transformPackToPackPublic({
  pack,
  minigamesPublic,
}: {
  pack: Exclude<Awaited<ReturnType<typeof getPack>>, undefined>;
  minigamesPublic: Awaited<ReturnType<typeof getPackMinigamesPublic>>;
}): Pack {
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
    iconImage: pack.iconImage
      ? {
          normal: `${env.BASE_API}/api/packs/${encodeURIComponent(pack.id)}/images/icon`,
          discord: `https://${env.DISCORD_CLIENT_ID}.discordsays.com/.proxy/api/packs/${encodeURIComponent(pack.id)}/images/icon`,
        }
      : null,
    minigames: {
      data: minigamesPublic.minigames,
      offset: minigamesPublic.offset,
      limit: minigamesPublic.limit,
      total: minigamesPublic.total,
    },
    createdAt: pack.createdAt.toString(),
  };
}
