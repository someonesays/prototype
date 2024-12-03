import type { ParentSdk, RoomWebsocket, ServerOpcodes, ServerTypes } from "@/public";
import { writable } from "svelte/store";

export let room = writable<ServerTypes[ServerOpcodes.GET_INFORMATION] | null>(null);
export let roomHandshakeCount = writable(0);
export let roomWs = writable<RoomWebsocket | null>(null);
export let roomRequestedToLeave = writable(false);
export let roomLobbyErrorMessage = writable<string | null>(null);
export let roomParentSdk = writable<ParentSdk | null>(null);
export let roomMinigameReady = writable(false);
