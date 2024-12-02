import env from "@/env";
import type { ApiRoomExists } from "@/public";

/**
 * Check if a room with the given room ID exists
 * @param data The url and the room ID
 * @returns Whether or not the room exists and if it reached the max players in the room
 */
export async function checkIfRoomExists({ url, roomId }: { url: string; roomId: string }) {
  const res = await fetch(`${url}/api/rooms/${encodeURIComponent(roomId)}`, {
    headers: { authorization: env.ROOMS_AUTHORIZATION },
  });
  try {
    return (await res.json()) as ApiRoomExists;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function resetRoom({ url, roomId }: { url: string; roomId: string }) {
  const res = await fetch(`${url}/api/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
    headers: { authorization: env.ROOMS_AUTHORIZATION },
  });
  return res.ok;
}
