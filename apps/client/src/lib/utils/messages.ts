import {
  ClientOpcodes,
  encodeOppackClient,
  encodeJsonClient,
  decodeOppackServer,
  decodeJsonServer,
  type ClientValidation,
} from "@/public";
import type { z } from "zod";

export async function parseMessage({ messageType, payload }: { messageType: "Oppack" | "Json"; payload: any }) {
  switch (messageType) {
    case "Oppack":
      return decodeOppackServer(new Uint8Array(await payload.arrayBuffer()));
    case "Json":
      return decodeJsonServer(JSON.parse(payload as string));
  }
}

export function createSendMessage({ ws, messageType }: { ws: WebSocket; messageType: "Oppack" | "Json" }) {
  return <O extends ClientOpcodes>({
    opcode,
    data,
  }: {
    opcode: O;
    data: z.infer<(typeof ClientValidation)[O]>;
  }) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    switch (messageType) {
      case "Oppack":
        return ws.send(encodeOppackClient({ opcode, data }));
      case "Json":
        return ws.send(encodeJsonClient({ opcode, data }));
    }
  };
}
