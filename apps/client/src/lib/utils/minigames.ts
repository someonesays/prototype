import env from "./env";
import { get } from "svelte/store";
import { isModalOpen } from "$lib/stores/home/modal";
import { launcher } from "$lib/stores/home/launcher";
import { roomFeaturedMinigames, roomLobbyPopupMessage } from "$lib/stores/home/roomState";
import type { ApiGetMinigames } from "@/public";

export async function getFeaturedMinigames() {
  let url: string;
  switch (get(launcher)) {
    case "normal":
      url = `${env.VITE_BASE_API}/api/minigames?featured=true`;
      break;
    case "discord":
      url = `/.proxy/api/minigames?featured=true`;
      break;
    default:
      throw new Error("Invalid launcher for getFeaturedMinigames");
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load featured minigames (response is not OK)");

    const featuredMinigames = (await res.json()) as ApiGetMinigames;
    roomFeaturedMinigames.set({ success: true, minigames: featuredMinigames.minigames });

    return true;
  } catch (err) {
    console.error(err);

    roomFeaturedMinigames.set({ success: false, minigames: [] });
    return false;
  }
}
