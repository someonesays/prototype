import EventEmitter from "eventemitter3";
import {
  ServerOpcodes,
  decodeOppackServer,
  decodeJsonServer,
  ClientOpcodes,
  ClientValidation,
  encodeOppackClient,
  encodeJsonClient,
  type ServerTypes,
  type ServerOpcodesStringKeys,
} from "../";
import type { z } from "zod";

export class RoomWebsocket {
  ws: WebSocket;
  send: ReturnType<typeof RoomWebsocket.createSendMessage>;
  onclose?: ((evt: CloseEvent) => any) | null;

  private emitter = new EventEmitter<ServerOpcodesStringKeys>();
  messageType: "Json" | "Oppack";

  static async parseMessage({ messageType, payload }: { messageType: "Oppack" | "Json"; payload: any }) {
    switch (messageType) {
      case "Oppack":
        return decodeOppackServer(new Uint8Array(await payload.arrayBuffer()));
      case "Json":
        return decodeJsonServer(JSON.parse(payload as string));
    }
  }

  static createSendMessage({ ws, messageType }: { ws: WebSocket; messageType: "Oppack" | "Json" }) {
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

  constructor({
    debug = false,
    url,
    authorization,
    messageType = "Oppack",
  }: { debug?: boolean; url: string; authorization: string; messageType?: "Json" | "Oppack" }) {
    this.messageType = messageType;

    // Connects to WebSocket and creates send function
    this.ws = new WebSocket(url, [authorization, messageType]);
    this.send = RoomWebsocket.createSendMessage({ ws: this.ws, messageType });

    // Handle WebSocket
    if (debug) {
      this.ws.onopen = () => console.debug("[WEBSOCKET] Connected!");
    }

    this.ws.onmessage = async ({ data: payload }) => {
      const { opcode, data } = await RoomWebsocket.parseMessage({ messageType, payload });

      if (debug) {
        console.debug(
          "[WEBSOCKET] Recieved message:",
          `ServerOpcodes.${Object.entries(ServerOpcodes).find(([_, k]) => k === opcode)?.[0]} (${opcode})`,
          data,
        );
      }

      return this.emit(opcode, data);
    };

    this.ws.onclose = (evt) => {
      if (debug) console.debug("[WEBSOCKET] Disconnected.");
      return this.onclose?.(evt);
    };
  }

  on<O extends ServerOpcodes>(evt: O, listener: (payload: ServerTypes[O]) => unknown) {
    return this.emitter.on(evt.toString() as ServerOpcodesStringKeys, listener);
  }
  once<O extends ServerOpcodes>(evt: O, listener: (payload: ServerTypes[O]) => unknown) {
    return this.emitter.once(evt.toString() as ServerOpcodesStringKeys, listener);
  }
  off<O extends ServerOpcodes>(evt: O, listener: (payload: ServerTypes[O]) => unknown) {
    return this.emitter.off(evt.toString() as ServerOpcodesStringKeys, listener);
  }
  private emit<O extends ServerOpcodes>(evt: O, msg: ServerTypes[O]) {
    return this.emitter.emit(evt.toString() as ServerOpcodesStringKeys, msg);
  }

  destroy() {
    this.ws?.close();
    this.emitter.removeAllListeners();
  }
}
