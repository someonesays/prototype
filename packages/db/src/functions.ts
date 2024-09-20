import { minigames } from "./minigames";
import { Visibility } from "@/public";

export function getMinigames({
  visibility = [Visibility.Private, Visibility.Public],
}: { visibility: Visibility[] }) {
  return minigames.find((p) => visibility.includes(p.visibility));
}

export function getMinigame(id: string) {
  return minigames.find((p) => p.id === id);
}

export function getRandomMinigame() {
  return minigames[Math.floor(Math.random() * minigames.length)];
}
