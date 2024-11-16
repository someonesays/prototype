import type { RoomWebsocket, ServerOpcodes, ServerTypes } from "@/public";
import { writable } from "svelte/store";

export let room = writable<ServerTypes[ServerOpcodes.GetInformation] | null>(null);
export let roomWs = writable<RoomWebsocket | null>(null);
