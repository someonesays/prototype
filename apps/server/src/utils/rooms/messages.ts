import {
  decodeOppackClient,
  encodeOppackServer,
  decodeJsonClient,
  encodeJsonServer,
  ServerOpcodes,
  type ServerTypes,
} from "@/sdk";
import type { WSMessageReceive } from "hono/ws";
import type { ServerPlayer, ServerRoom } from "../types/rooms";

export function broadcastMessage<O extends ServerOpcodes>({
  room,
  readyOnly = false,
  ignoreUsers = [],
  opcode,
  data,
}: {
  room: ServerRoom;
  readyOnly?: boolean;
  ignoreUsers?: ServerPlayer[];
  opcode: O;
  data: ServerTypes[O];
}) {
  for (const user of room.players.values()) {
    if (ignoreUsers.includes(user) || (readyOnly && !user.ready)) continue;
    sendMessage({ user, opcode, data });
  }
}

export function sendMessage<O extends ServerOpcodes>({
  user,
  opcode,
  data,
}: {
  user: ServerPlayer;
  opcode: O;
  data: ServerTypes[O];
}) {
  if (user.ws.readyState !== 1) return;

  switch (user.messageType) {
    case "Oppack":
      return user.ws.send(encodeOppackServer({ opcode, data }));
    case "Json":
      return user.ws.send(encodeJsonServer({ opcode, data }));
  }
}

export function sendError(user: ServerPlayer, message: string) {
  return sendMessage({
    user,
    opcode: ServerOpcodes.Error,
    data: { message },
  });
}

export function recieveMessage({
  user,
  payload,
}: {
  user: ServerPlayer;
  payload: WSMessageReceive;
}) {
  if (user.ws.readyState !== 1) throw new Error("Cannot send message to a WebSocket not READY");

  switch (user.messageType) {
    case "Oppack":
      return decodeOppackClient(new Uint8Array(payload as ArrayBufferLike));
    case "Json":
      return decodeJsonClient(JSON.parse(payload as string));
  }
}
