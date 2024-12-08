import env from "@/env";
import schema from "../main/schema";
import { and, eq, asc, sql, or } from "drizzle-orm";
import { db } from "../connectors/pool";
import { transformMinigameToMinigamePublic } from "./minigames";
import { NOW } from "./utils";
import { PackPublishType, type Pack } from "@/public";

export async function createPack(pack: typeof schema.packs.$inferInsert) {
  return (await db.insert(schema.packs).values(pack).returning({ id: schema.packs.id }))[0].id;
}

export async function updatePack(pack: Partial<typeof schema.packs.$inferSelect> & { id: string }) {
  await db
    .update(schema.packs)
    .set({ ...pack, updatedAt: NOW })
    .where(eq(schema.packs.id, pack.id));
}

export async function updatePackWithAuthorId(
  pack: Partial<typeof schema.packs.$inferSelect> & { id: string; authorId: string },
) {
  await db
    .update(schema.packs)
    .set({ ...pack, updatedAt: NOW })
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

export async function getPacks({
  isPublic,
  featured,
  authorId,
  offset = 0,
  limit = 50,
}: { isPublic?: boolean; featured?: boolean; authorId?: string; offset?: number; limit?: number }) {
  const packs = await db.query.packs.findMany({
    offset,
    limit,
    where: getPackWhere({ isPublic, featured, authorId }),
    orderBy: asc(schema.packs.createdAt),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
  return {
    offset,
    limit,
    total: await getPackCount({ isPublic, featured, authorId }),
    packs,
  };
}

export function getPackCount({
  isPublic,
  featured,
  authorId,
}: { isPublic?: boolean; featured?: boolean; authorId?: string }) {
  return db.$count(schema.packs, getPackWhere({ isPublic, featured, authorId }));
}

function getPackWhere({ isPublic, featured, authorId }: { isPublic?: boolean; featured?: boolean; authorId?: string }) {
  return and(
    typeof isPublic === "boolean"
      ? or(
          eq(schema.packs.publishType, PackPublishType.PUBLIC_OFFICIAL),
          eq(schema.packs.publishType, PackPublishType.PUBLIC_UNOFFICIAL),
        )
      : undefined,
    typeof featured === "boolean" ? eq(schema.packs.currentlyFeatured, true) : undefined,
    typeof authorId === "string" ? eq(schema.packs.authorId, authorId) : undefined,
  );
}

export async function getPacksPublic({
  isPublic,
  featured,
  authorId,
  offset = 0,
  limit = 50,
}: { isPublic?: boolean; featured?: boolean; authorId?: string; offset?: number; limit?: number }) {
  const { total, packs } = await getPacks({ isPublic, featured, authorId, offset, limit });
  return {
    offset,
    limit,
    total,
    packs: packs.map((p) => transformPackToPackPublic(p)),
  };
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

export function getPackMinigames({
  id,
  offset = 0,
  limit = 50,
  randomSeed = null,
}: { id: string; offset?: number; limit?: number; randomSeed?: number | null }) {
  return db.transaction(async (tx) => {
    if (randomSeed !== null && (typeof randomSeed !== "number" || randomSeed < -1 || randomSeed > 1)) {
      throw new Error("Failed randomSeed runtime validation check. This should never happen.");
    }

    await tx.execute(`SELECT setseed(${randomSeed})`);
    return (
      await tx.query.packsMinigames.findMany({
        offset,
        limit,
        where: eq(schema.packsMinigames.packId, id),
        orderBy: randomSeed ? sql<number>`random()`.mapWith(Number) : asc(schema.packsMinigames.createdAt),
        with: {
          minigame: {
            with: {
              author: {
                columns: { id: true, name: true, createdAt: true },
              },
            },
          },
        },
      })
    ).map((m) => transformMinigameToMinigamePublic(m.minigame));
  });
}

export async function getPackMinigamesByAuthorId({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }) {
  return (
    await db.query.packsMinigames.findMany({
      offset,
      limit,
      where: eq(schema.packsMinigames.packId, id),
      orderBy: asc(schema.packsMinigames.createdAt),
      with: {
        minigame: {
          with: {
            author: {
              columns: { id: true, name: true, createdAt: true },
            },
          },
        },
      },
    })
  ).map((m) => transformMinigameToMinigamePublic(m.minigame));
}

export function getPackMinigameCount(id: string) {
  return db.$count(schema.packsMinigames, eq(schema.packsMinigames.packId, id));
}

export async function getPackPublic(id: string): Promise<Pack | null> {
  const pack = await getPack(id);
  if (!pack) return null;

  return transformPackToPackPublic(pack);
}

export async function getPackMinigamesPublic({
  id,
  offset = 0,
  limit = 50,
  randomSeed = null,
}: { id: string; offset?: number; limit?: number; randomSeed?: number | null }) {
  return {
    offset,
    limit,
    total: await getPackMinigameCount(id),
    minigames: await getPackMinigames({ id, offset, limit, randomSeed }),
  };
}

export async function isMinigameInPack({ packId, minigameId }: { packId: string; minigameId: string }) {
  return !!(await db.query.packsMinigames.findFirst({
    where: and(eq(schema.packsMinigames.packId, packId), eq(schema.packsMinigames.minigameId, minigameId)),
  }));
}

export function transformPackToPackPublic(pack: Exclude<Awaited<ReturnType<typeof getPack>>, undefined>): Pack {
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
          normal: `${env.BASE_API}/api/images/packs/${encodeURIComponent(pack.id)}/icon?v=${pack.updatedAt.getTime()}`,
          discord: `https://${env.DISCORD_CLIENT_ID}.discordsays.com/.proxy/api/images/packs/${encodeURIComponent(pack.id)}/icon?v=${pack.updatedAt.getTime()}`,
        }
      : null,
    randomize: pack.randomize,
    createdAt: pack.createdAt.toString(),
    updatedAt: pack.updatedAt.toString(),
  };
}
