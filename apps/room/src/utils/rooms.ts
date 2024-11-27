import env from "@/env";
import { getServerById, updateServer } from "@/db";
import type { ServerRoom } from "./types";

const server = await getServerById(env.SERVER_ID);
if (!server) throw new Error("Cannot find server in the database!");

export const rooms = new Map<string, ServerRoom>();
export let maxRooms = server.maxRooms || 0;
export let serverStarted = Math.trunc(Date.now() / 1000);

setCurrentRooms(0); // Reset max rooms count to 0

export function setCurrentRooms(rooms: number) {
  return updateServer({
    id: env.SERVER_ID,
    currentRooms: rooms,
  });
}

export function resetServerStartedDate() {
  serverStarted = Math.trunc(Date.now() / 1000);
}

export function setMaxRooms(rooms: number) {
  maxRooms = rooms;
  return updateServer({
    id: env.SERVER_ID,
    maxRooms,
  });
}
