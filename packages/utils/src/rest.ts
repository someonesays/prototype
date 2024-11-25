import env from "@/env";
import type { ApiRoomExists } from "@/public";

/**
 * Check if a room with the given room ID exists
 * @param data The url and the room ID
 * @returns Whether or not the request was successfully sent and if the room exists or not
 */
export async function checkIfRoomExists({
  url,
  roomId,
}: { url: string; roomId: string }): Promise<[boolean, ApiRoomExists]> {
  const res = await fetch(`${url}/api/rooms/${encodeURIComponent(roomId)}`, {
    headers: { authorization: env.ROOMS_AUTHORIZATION },
  });
  try {
    return [true, (await res.json()) as ApiRoomExists];
  } catch (err) {
    console.error(err);
    return [false, { exists: false }];
  }
}
