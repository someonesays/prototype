import { packs } from "../packs";
import { PackVisibility, type Pack } from "@/public";
import { getMinigamePublic } from "./minigames";

export function getPacks({
  visibility = [PackVisibility.Disabled, PackVisibility.Unlisted, PackVisibility.Public],
}: { visibility: PackVisibility[] }) {
  return packs.find((p) => visibility.includes(p.visibility));
}

export async function getPack(id: string) {
  return packs.find((p) => p.id === id);
}

export async function getPackPublic({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }): Promise<Pack | null> {
  const pack = await getPack(id);
  if (!pack) return null;

  const {
    offset: actualOffset,
    limit: actualLimit,
    total,
    minigames,
  } = await getPackMinigamesPublic({
    id,
    offset,
    limit,
  });

  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    author: {
      name: pack.author.name,
    },
    iconImage:
      pack.iconImage && pack.iconPlaceholderImage
        ? {
            url: pack.iconImage,
            placeholder: pack.iconPlaceholderImage,
          }
        : null,
    visibility: pack.visibility,
    reportable: pack.reportable,
    minigames: {
      data: minigames,
      offset: actualOffset,
      limit: actualLimit,
      total,
    },
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
  };
}

export async function getPackMinigamesPublic({
  id,
  offset = 0,
  limit = 50,
}: { id: string; offset?: number; limit?: number }) {
  const pack = await getPack(id);
  const minigames = [];

  if (pack) {
    for (const { id } of pack.minigames) {
      const minigame = await getMinigamePublic(id);
      if (minigame) minigames.push(minigame);
    }
  }

  return {
    id,
    offset,
    limit,
    total: minigames.length,
    minigames: minigames.slice(offset).slice(0, limit),
  };
}

export async function isMinigameInPack({ id, minigameId }: { id: string; minigameId: string }) {
  const pack = await getPack(id);
  return !!pack?.minigames.find((p) => p.id === minigameId);
}

export function getRandomPack() {
  return packs[Math.floor(Math.random() * packs.length)];
}
