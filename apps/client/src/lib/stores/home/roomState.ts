import type { ApiGetMinigames, ParentSdk, RoomWebsocket, ServerOpcodes, ServerTypes } from "@/public";
import { writable } from "svelte/store";

export let room = writable<ServerTypes[ServerOpcodes.GET_INFORMATION] | null>(null);
export let roomHandshakeCount = writable(0);
export let roomWs = writable<RoomWebsocket | null>(null);
export let roomSearchedMinigames = writable<({ success: boolean } & ApiGetMinigames) | null>(null);
export let roomFeaturedMinigames = writable<({ success: boolean } & ApiGetMinigames) | null>(null);
export let roomRequestedToChangeSettings = writable(false);
export let roomRequestedToStartGame = writable(false);
export let roomJoinedLate = writable(false);
export let roomRequestedToLeave = writable(false);
export let roomLobbyPopupMessage = writable<
  | { type: "warning"; message: string }
  | { type: "link"; url: string }
  | {
      type: "invite" | "select-minigame" | "select-minigame-search" | "report" | "mobile";
    }
  | null
>(null);
export let roomParentSdk = writable<ParentSdk | null>(null);
export let roomMinigameReady = writable(false);
