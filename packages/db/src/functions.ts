import env from "@/env";
import { minigames } from "./minigames";
import { Visibility } from "@/public";
import type { Minigame } from "@/sdk";

export function getMinigames({ visibility = [Visibility.Private, Visibility.Public] }: { visibility: Visibility[] }) {
  return minigames.find((p) => visibility.includes(p.visibility));
}

export async function getMinigame(id: string) {
  return minigames.find((p) => p.id === id);
}

export async function getMinigamePublic(id: string): Promise<Minigame | null> {
  const minigame = await getMinigame(id);
  if (!minigame) return null;

  return {
    id: minigame.id,
    visibility: minigame.visibility,
    prompt: minigame.prompt,
    minimumPlayersToStart: minigame.minimumPlayersToStart,
    author: {
      name: minigame.author.name,
    },
    url: `${env.ViteBaseApi}/api/proxy/${minigame.id}/`,
    createdAt: minigame.createdAt,
    updatedAt: minigame.updatedAt,
  };
}

export function getRandomMinigame() {
  return minigames[Math.floor(Math.random() * minigames.length)];
}
