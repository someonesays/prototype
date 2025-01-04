import env from "@/env";
import schema from "../main/schema";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { db } from "../connectors/pool";
import { NOW } from "./utils";
import { MinigamePublishType, type Minigame } from "@/public";

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

export async function getMinigames({
  query,
  authorId,
  publicOnly,
  currentlyFeatured,
  offset = 0,
  limit = 50,
}: {
  query?: string;
  authorId?: string;
  publicOnly?: boolean;
  currentlyFeatured?: boolean;
  offset?: number;
  limit?: number;
}) {
  const where = createMinigamesWhereCondition({ query, authorId, publicOnly, currentlyFeatured });
  return {
    offset,
    limit,
    total: await db.$count(schema.minigames, where),
    minigames: await db.query.minigames.findMany({
      offset,
      limit,
      where,
      orderBy: asc(schema.minigames.createdAt),
      with: {
        author: { columns: { id: true, name: true, createdAt: true } },
      },
    }),
  };
}

export async function getMinigamesPublic(opts: {
  query?: string;
  authorId?: string;
  publicOnly?: boolean;
  currentlyFeatured?: boolean;
  offset?: number;
  limit?: number;
}) {
  const { offset, limit, total, minigames } = await getMinigames(opts);
  return { offset, limit, total, minigames: minigames.map((m) => transformMinigameToMinigamePublic(m)) };
}

export function getMinigamesCount({
  authorId,
  publicOnly,
  currentlyFeatured,
}: {
  authorId?: string;
  publicOnly?: boolean;
  currentlyFeatured?: boolean;
}) {
  return db.$count(schema.minigames, createMinigamesWhereCondition({ authorId, publicOnly, currentlyFeatured }));
}

function createMinigamesWhereCondition({
  query,
  authorId,
  publicOnly,
  currentlyFeatured,
}: {
  query?: string;
  authorId?: string;
  publicOnly?: boolean;
  currentlyFeatured?: boolean;
}) {
  return and(
    typeof query === "string" ? sql`strpos(lower(${schema.minigames.name}), ${query.toLowerCase()}) > 0` : undefined,
    publicOnly
      ? or(
          eq(schema.minigames.publishType, MinigamePublishType.PUBLIC_OFFICIAL),
          eq(schema.minigames.publishType, MinigamePublishType.PUBLIC_UNOFFICIAL),
        )
      : undefined,
    authorId ? eq(schema.minigames.authorId, authorId) : undefined,
    currentlyFeatured ? eq(schema.minigames.currentlyFeatured, true) : undefined,
  );
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

export function transformMinigameToMinigamePublic(minigame: Awaited<ReturnType<typeof getMinigame>>): Minigame {
  if (!minigame) throw new Error("Missing minigame");
  return {
    id: minigame.id,
    name: minigame.name,
    description: minigame.description,
    publishType: minigame.publishType,
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
