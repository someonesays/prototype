import env from "$lib/utils/env";
import { goto } from "$app/navigation";
import { ErrorMessageCodes, ErrorMessageCodesToText, ParentSdk } from "@/public";
import { roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";

export async function load({ params }) {
  const roomId = params.roomId;
  const exists = await ParentSdk.getIfRoomExists({
    roomId,
    // You'll never run into /join/[roomId] unless you connect to the website to it,
    // so I don't need to worry about changing the 'launcher' store value.
    baseUrl: env.VITE_BASE_API,
  });
  if (!exists) {
    kickedReason.set(ErrorMessageCodesToText[ErrorMessageCodes.ROOM_NOT_FOUND]);
    return goto("/");
  }
  roomIdToJoin.set(roomId);
}
