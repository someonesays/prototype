import env from "@/env";
import { getServerById, updateServer } from "@/db";
import type { ServerRoom } from "./types";

const server = await getServerById(env.ServerId);
if (!server) throw new Error("Cannot find server in the database!");

export const rooms = new Map<string, ServerRoom>();
export let maxRooms = server.maxRooms || 0;

export function setMaxRooms(rooms: number) {
  maxRooms = rooms;
  return updateServer({
    id: env.ServerId,
    maxRooms,
  });
}
