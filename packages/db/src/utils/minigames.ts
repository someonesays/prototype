import env from "@/env";
import schema from "../main/schema";
import { and, asc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "../connectors/pool";
import { NOW } from "./utils";
import type { Minigame, PrivateMinigame } from "@/public";

export async function createMinigame(minigame: typeof schema.minigames.$inferInsert) {
  return (await db.insert(schema.minigames).values(minigame).returning({ id: schema.minigames.id }))[0].id;
}

export async function updateMinigame(minigame: Partial<PrivateMinigame> & { id: string }) {
  await db
    .update(schema.minigames)
    .set({ ...minigame, updatedAt: NOW })
    .where(eq(schema.minigames.id, minigame.id));
}

export async function updateMinigameWithAuthorId(minigame: Partial<PrivateMinigame> & { id: string; authorId: string }) {
  await db
    .update(schema.minigames)
    .set({ ...minigame, updatedAt: NOW })
    .where(and(eq(schema.minigames.id, minigame.id), eq(schema.minigames.authorId, minigame.authorId)));
}

export async function requestMinigameReview({ id, authorId }: { id: string; authorId: string }) {
  await db
    .update(schema.minigames)
    .set({ updatedAt: NOW, underReview: NOW })
    .where(
      and(
        eq(schema.minigames.id, id),
        eq(schema.minigames.authorId, authorId),
        eq(schema.minigames.canPublish, false),
        isNotNull(schema.minigames.termsOfServices),
        isNotNull(schema.minigames.privacyPolicy),
      ),
    );
}

export async function deleteMinigame(id: string) {
  await db.delete(schema.minigames).where(eq(schema.minigames.id, id));
}

export async function deleteMinigameWithAuthorId({ id, authorId }: { id: string; authorId: string }) {
  await db.delete(schema.minigames).where(and(eq(schema.minigames.id, id), eq(schema.minigames.authorId, authorId)));
}

export function featureMinigames(ids: string[]) {
  return db.transaction(async (tx) => {
    await tx.update(schema.minigames).set({ currentlyFeatured: false });
    await tx
      .update(schema.minigames)
      .set({ currentlyFeatured: true, previouslyFeaturedDate: NOW })
      .where(inArray(schema.minigames.id, ids));
  });
}

export async function getMinigames({
  query,
  authorId,
  publicOnly,
  underReview,
  include,
  offset = 0,
  limit = 50,
}: {
  query?: string;
  authorId?: string;
  publicOnly?: boolean;
  underReview?: boolean;
  include?: ("official" | "unofficial" | "featured" | "currently_featured")[];
  offset?: number;
  limit?: number;
}) {
  const where = createMinigamesWhereCondition({ query, authorId, publicOnly, underReview, include });
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
  underReview?: boolean;
  include?: ("official" | "unofficial" | "featured" | "currently_featured")[];
  offset?: number;
  limit?: number;
}) {
  const { offset, limit, total, minigames } = await getMinigames(opts);
  return { offset, limit, total, minigames: minigames.map((m) => transformMinigameToMinigamePublic(m)) };
}

export function getMinigamesCount(opts: {
  authorId?: string;
  publicOnly?: boolean;
  underReview?: boolean;
  include?: ("official" | "unofficial" | "featured" | "currently_featured")[];
}) {
  return db.$count(schema.minigames, createMinigamesWhereCondition(opts));
}

function createMinigamesWhereCondition({
  query,
  authorId,
  publicOnly,
  underReview,
  include,
}: {
  query?: string;
  authorId?: string;
  publicOnly?: boolean;
  underReview?: boolean;
  include?: ("official" | "unofficial" | "featured" | "currently_featured")[];
}) {
  return and(
    typeof query === "string" ? sql`strpos(lower(${schema.minigames.name}), ${query.toLowerCase()}) > 0` : undefined,
    authorId ? eq(schema.minigames.authorId, authorId) : undefined,
    publicOnly ? eq(schema.minigames.published, true) : undefined,
    underReview ? isNotNull(schema.minigames.underReview) : undefined,
    include?.length
      ? or(
          include.includes("official") ? eq(schema.minigames.official, true) : undefined,
          include.includes("unofficial") ? eq(schema.minigames.official, false) : undefined,
          include.includes("featured") ? isNotNull(schema.minigames.previouslyFeaturedDate) : undefined,
          include.includes("currently_featured") ? eq(schema.minigames.currentlyFeatured, true) : undefined,
        )
      : undefined,
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
    published: minigame.published,
    official: minigame.official,
    currentlyFeatured: minigame.currentlyFeatured,
    previouslyFeaturedDate: minigame.previouslyFeaturedDate?.toString() ?? null,
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
