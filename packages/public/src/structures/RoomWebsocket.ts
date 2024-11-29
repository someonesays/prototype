import EventEmitter from "eventemitter3";
import {
  ServerOpcodes,
  decodeOppackServer,
  decodeJsonServer,
  ClientOpcodes,
  ClientValidation,
  encodeOppackClient,
  encodeJsonClient,
  MatchmakingLocation,
  MatchmakingType,
  ErrorMessageCodes,
  type ServerTypes,
  type ApiErrorResponse,
  type MatchmakingResponse,
} from "../";
import type { z } from "zod";

export class RoomWebsocket {
  ws: WebSocket;
  send: ReturnType<typeof RoomWebsocket.createSendMessage>;
  onclose?: ((evt: CloseEvent) => any) | null;

  private emitter = new EventEmitter();
  messageType: "Json" | "Oppack";

  static async getIfRoomExists({ roomId, baseUrl }: { roomId: string; baseUrl: string }) {
    const res = await fetch(`${baseUrl}/api/matchmaking?roomId=${encodeURIComponent(roomId)}`);
    return res.status === 200;
  }

  static async getMatchmaking({
    captcha,
    displayName,
    location,
    roomId,
    mobile,
    baseUrl,
  }: {
    auth?: string;
    captcha: {
      type: "invisible" | "managed";
      token: string;
    };
    displayName: string;
    location?: MatchmakingLocation;
    roomId?: string;
    mobile: boolean;
    baseUrl: string;
  }) {
    if (!location && !roomId) throw new Error("Either location or roomId must be present to get matchmaking!");
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-captcha-type": captcha.type,
          "x-captcha-token": captcha.token,
        },
        body: JSON.stringify({
          type: MatchmakingType.NORMAL,
          location,
          roomId,
          displayName,
          mobile,
        }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as MatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
    }
  }

  static async getMatchmakingTesting({
    displayName,
    minigameId,
    testingAccessCode,
    mobile,
    baseUrl,
  }: {
    displayName: string;
    minigameId: string;
    testingAccessCode: string;
    mobile: boolean;
    baseUrl: string;
  }) {
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking/testing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: MatchmakingType.TESTING, displayName, minigameId, testingAccessCode }),
      });

      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as MatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
    }
  }

  static async getMatchmakingDiscord({
    instanceId,
    code,
    mobile,
    baseUrl,
  }: { instanceId: string; code: string; mobile: boolean; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: MatchmakingType.DISCORD, instanceId, code, mobile }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as MatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
    }
  }

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
    return this.emitter.on(evt.toString(), listener);
  }
  once<O extends ServerOpcodes>(evt: O, listener: (payload: ServerTypes[O]) => unknown) {
    return this.emitter.once(evt.toString(), listener);
  }
  off<O extends ServerOpcodes>(evt: O, listener: (payload: ServerTypes[O]) => unknown) {
    return this.emitter.off(evt.toString(), listener);
  }
  private emit<O extends ServerOpcodes>(evt: O, msg: ServerTypes[O]) {
    return this.emitter.emit(evt.toString(), msg);
  }

  close() {
    this.ws?.close();
    this.emitter.removeAllListeners();
  }
}
