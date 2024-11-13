import env from "@/env";
import type { APIRoomExists } from "@/public";

export async function checkIfRoomExists({ url, roomId }: { url: string; roomId: string }) {
  const res = await fetch(`${url}/api/rooms/${encodeURIComponent(roomId)}`, {
    headers: { authorization: env.RoomAuthorization },
  });
  return (await res.json()) as APIRoomExists;
}
