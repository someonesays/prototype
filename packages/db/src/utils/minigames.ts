import schema from "../main/schema";
import { eq, inArray } from "drizzle-orm";
import { db } from "../connectors/pool";
import type { Minigame } from "@/public";

export async function createMinigame(minigame: typeof schema.minigames.$inferInsert) {
  return (await db.insert(schema.minigames).values(minigame).returning({ id: schema.minigames.id }))[0].id;
}

export async function updateMinigame(minigame: Partial<typeof schema.minigames.$inferSelect> & { id: string }) {
  await db.update(schema.minigames).set(minigame).where(eq(schema.minigames.id, minigame.id));
}

export async function deleteMinigame(id: string) {
  await db.delete(schema.minigames).where(eq(schema.minigames.id, id));
}

export function getMinigamesByIds(ids: string[]) {
  return db.query.minigames.findMany({
    where: inArray(schema.minigames.id, ids),
    with: {
      author: {
        columns: { id: true, name: true, createdAt: true },
      },
    },
  });
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

export async function getMinigamePublic(id: string) {
  const minigame = await getMinigame(id);
  if (!minigame) return null;

  return transformMinigameToMinigamePublic(minigame);
}

export async function getMinigamesByIdsPublic(ids: string[]) {
  const minigames = await getMinigamesByIds(ids);
  return minigames.map((m) => transformMinigameToMinigamePublic(m));
}

function transformMinigameToMinigamePublic(minigame: Awaited<ReturnType<typeof getMinigame>>): Minigame {
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
    previewImage:
      minigame.previewImage && minigame.previewPlaceholderImage
        ? {
            url: minigame.previewImage,
            placeholder: minigame.previewPlaceholderImage,
          }
        : null,
    opts: {
      prompt: minigame.prompt,
      minimumPlayersToStart: minigame.minimumPlayersToStart,
    },
    legal: {
      privacy: minigame.legalPrivacyUrl,
      terms: minigame.legalTermsUrl,
    },
    createdAt: minigame.createdAt.toString(),
  };
}
