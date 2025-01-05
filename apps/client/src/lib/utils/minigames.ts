import env from "./env";
import { get } from "svelte/store";
import { launcher } from "$lib/stores/home/launcher";
import { roomFeaturedMinigames } from "$lib/stores/home/roomState";
import type { ApiGetMinigames } from "@/public";

export async function getFeaturedMinigames() {
  const minigames = await searchMinigames({ include: ["featured"] });

  roomFeaturedMinigames.set(minigames);
  return minigames.success;
}

export async function searchMinigames(opts: {
  query?: string;
  include?: ("official" | "unofficial" | "featured")[];
  offset?: number;
  limit?: number;
}) {
  // @ts-ignore This piece of code works perfectly fine
  const params = new URLSearchParams(opts).toString();

  let url: string;
  switch (get(launcher)) {
    case "normal":
      url = `${env.VITE_BASE_API}/api/minigames?${params}`;
      break;
    case "discord":
      url = `/.proxy/api/minigames?${params}`;
      break;
    default:
      throw new Error("Invalid launcher for getFeaturedMinigames");
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch minigames (response is not OK)");

    const { offset, limit, total, minigames } = (await res.json()) as ApiGetMinigames;
    return { success: true, offset, limit, total, minigames };
  } catch (err) {
    console.error(err);
    return { success: false, offset: 0, limit: 0, total: 0, minigames: [] };
  }
}
