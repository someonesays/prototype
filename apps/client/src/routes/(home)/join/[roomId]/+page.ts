import { VITE_BASE_API } from "$lib/utils/env";

import { goto } from "$app/navigation";

import { MessageCodes, MessageCodesToText, ParentSdk } from "@/public";

import { roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";

export async function load({ params }) {
  const roomId = params.roomId;
  const exists = await ParentSdk.getIfRoomExists({ roomId, baseUrl: VITE_BASE_API });
  if (!exists) {
    kickedReason.set(MessageCodesToText[MessageCodes.RoomNotFound]);
    return goto("/");
  }
  roomIdToJoin.set(roomId);
}
