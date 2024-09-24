import {
  decodeOppackClient,
  encodeOppackServer,
  decodeJsonClient,
  encodeJsonServer,
  type ClientOpcodes,
  type ClientValidation,
  type ServerOpcodes,
  type ServerTypes,
} from "@/sdk";
import type { z } from "zod";
import type { WSMessageReceive } from "hono/ws";
import type { ServerPlayer } from "./types";

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

export function recieveMessage<O extends ClientOpcodes>({
  user,
  payload,
}: {
  user: ServerPlayer;
  payload: WSMessageReceive;
}): {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
} {
  if (user.ws.readyState !== 1) throw new Error("Cannot send message to a WebSocket not READY");

  switch (user.messageType) {
    case "Oppack":
      return decodeOppackClient(new Uint8Array(payload as ArrayBufferLike));
    case "Json":
      return decodeJsonClient(JSON.parse(payload as string));
  }
}
