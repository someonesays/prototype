import { VITE_BASE_API } from "$lib/utils/env";
import { goto } from "$app/navigation";
import { MessageCodes, MessageCodesToText, ParentSdk } from "@/public";
import { roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";

export async function load({ params }) {
  const roomId = params.roomId;
  const exists = await ParentSdk.getIfRoomExists({
    roomId,
    // You'll never run into /join/[roomId] unless you connect to the website to it,
    // so I don't need to worry about changing the 'launcher' store value.
    baseUrl: VITE_BASE_API,
  });
  if (!exists) {
    kickedReason.set(MessageCodesToText[MessageCodes.RoomNotFound]);
    return goto("/");
  }
  roomIdToJoin.set(roomId);
}
