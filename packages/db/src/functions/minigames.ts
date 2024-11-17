import env from "@/env";
import { minigames } from "../minigames";
import { MinigameVisibility, type Minigame } from "@/public";

export function getMinigames({
  visibility = [MinigameVisibility.Disabled, MinigameVisibility.Unlisted, MinigameVisibility.Public],
}: { visibility: MinigameVisibility[] }) {
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
    name: minigame.name,
    description: minigame.description,
    author: {
      name: minigame.author.name,
    },
    previewImage:
      minigame.previewImage && minigame.previewPlaceholderImage
        ? {
            url: minigame.previewImage,
            placeholder: minigame.previewPlaceholderImage,
          }
        : null,
    visibility: minigame.visibility,
    prompt: minigame.prompt,
    minimumPlayersToStart: minigame.minimumPlayersToStart,
    reportable: minigame.reportable,
    createdAt: minigame.createdAt,
    updatedAt: minigame.updatedAt,
  };
}

export function getRandomMinigame() {
  return minigames[Math.floor(Math.random() * minigames.length)];
}
