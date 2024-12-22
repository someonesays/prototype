import env from "@/env";
import schema from "../main/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../connectors/pool";
import { NOW } from "./utils";
import type { Minigame } from "@/public";

export async function createMinigame(minigame: typeof schema.minigames.$inferInsert) {
  return (await db.insert(schema.minigames).values(minigame).returning({ id: schema.minigames.id }))[0].id;
}

export async function updateMinigame(minigame: Partial<typeof schema.minigames.$inferSelect> & { id: string }) {
  await db
    .update(schema.minigames)
    .set({ ...minigame, updatedAt: NOW })
    .where(eq(schema.minigames.id, minigame.id));
}

export async function updateMinigameWithAuthorId(
  minigame: Partial<typeof schema.minigames.$inferSelect> & { id: string; authorId: string },
) {
  await db
    .update(schema.minigames)
    .set({ ...minigame, updatedAt: NOW })
    .where(and(eq(schema.minigames.id, minigame.id), eq(schema.minigames.authorId, minigame.authorId)));
}

export async function deleteMinigame(id: string) {
  await db.delete(schema.minigames).where(eq(schema.minigames.id, id));
}

export async function deleteMinigameWithAuthorId({ id, authorId }: { id: string; authorId: string }) {
  await db.delete(schema.minigames).where(and(eq(schema.minigames.id, id), eq(schema.minigames.authorId, authorId)));
}

export function getMinigamesByIds(ids: string[]) {
  return db.query.minigames.findMany({
    where: inArray(schema.minigames.id, ids),
    orderBy: asc(schema.minigames.createdAt),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
}

export async function getMinigamesByAuthorId({
  authorId,
  offset = 0,
  limit = 50,
}: { authorId: string; offset?: number; limit?: number }) {
  const minigames = await db.query.minigames.findMany({
    offset,
    limit,
    where: eq(schema.minigames.authorId, authorId),
    orderBy: asc(schema.minigames.createdAt),
  });
  return {
    offset,
    limit,
    total: await getMinigameCountByAuthorId(authorId),
    minigames,
  };
}

export function getMinigameCountByAuthorId(authorId: string) {
  return db.$count(schema.minigames, eq(schema.minigames.authorId, authorId));
}

export function getMinigame(id: string) {
  return db.query.minigames.findFirst({
    where: eq(schema.minigames.id, id),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
}

export function getMinigameByIdAndTestingAccessCode({ id, testingAccessCode }: { id: string; testingAccessCode: string }) {
  return db.query.minigames.findFirst({
    where: and(eq(schema.minigames.id, id), eq(schema.minigames.testingAccessCode, testingAccessCode)),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
}

export function getMinigameByAuthorId({ id, authorId }: { id: string; authorId: string }) {
  return db.query.minigames.findFirst({
    where: and(eq(schema.minigames.id, id), eq(schema.minigames.authorId, authorId)),
  });
}

export async function getMinigamePublic(id: string) {
  const minigame = await getMinigame(id);
  if (!minigame) return null;

  return transformMinigameToMinigamePublic(minigame);
}

export async function getMinigamesByIdsPublic(ids: string[]) {
  const minigames = await getMinigamesByIds(ids);
  return minigames.map((m) => transformMinigameToMinigamePublic(m));
}

export async function removeMinigameFromAllPacks(id: string) {
  await db.delete(schema.packsMinigames).where(eq(schema.packsMinigames.minigameId, id));
}

export function transformMinigameToMinigamePublic(minigame: Awaited<ReturnType<typeof getMinigame>>): Minigame {
  if (!minigame) throw new Error("Missing minigame");
  return {
    id: minigame.id,
    name: minigame.name,
    description: minigame.description,
    publishType: minigame.publishType,
    publicallyAddableToPack: minigame.publicallyAddableToPack,
    author: {
      id: minigame.author.id,
      name: minigame.author.name,
      createdAt: minigame.author.createdAt.toString(),
    },
    proxies: minigame.proxyUrl
      ? {
          normal: `${env.BASE_API}/.proxy/api/proxy/${encodeURIComponent(minigame.id)}/`,
          discord: `https://${env.DISCORD_CLIENT_ID}.discordsays.com/.proxy/api/proxy/${encodeURIComponent(minigame.id)}/`,
        }
      : null,
    previewImage: minigame.previewImage
      ? {
          normal: `${env.BASE_API}/api/images/minigames/${encodeURIComponent(minigame.id)}/preview?v=${minigame.updatedAt.getTime()}`,
          discord: `https://${env.DISCORD_CLIENT_ID}.discordsays.com/.proxy/api/images/minigames/${encodeURIComponent(minigame.id)}/preview?v=${minigame.updatedAt.getTime()}`,
        }
      : null,
    minimumPlayersToStart: minigame.minimumPlayersToStart,
    supportsMobile: minigame.supportsMobile,
    mobileOrientation: minigame.mobileOrientation,
    privacyPolicy: minigame.privacyPolicy,
    termsOfServices: minigame.termsOfServices,
    createdAt: minigame.createdAt.toString(),
    updatedAt: minigame.updatedAt.toString(),
  };
}
