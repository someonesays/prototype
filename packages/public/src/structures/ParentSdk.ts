import EventEmitter from "eventemitter3";
import {
  ParentOpcodes,
  MinigameOpcodes,
  MinigameValidation,
  MessageCodes,
  type Minigame,
  type ParentTypes,
  type APIResponse,
  type APIMatchmakingResponse,
  MatchmakingType,
} from "../types";
import type { z } from "zod";

/**
 * This is the parent SDK for Someone Says.
 * You want to initiate this class every time you load a new minigame.
 */
export class ParentSdk {
  public isReady = false;

  private emitter = new EventEmitter<MinigameOpcodes>();
  private iframe: HTMLIFrameElement;
  private isDestroyed = false;
  private targetOrigin = "*";

  static async getIfRoomExists({ roomId, baseUrl }: { roomId: string; baseUrl: string }) {
    const res = await fetch(`${baseUrl}/api/matchmaking?room_id=${encodeURIComponent(roomId)}`);
    return res.status === 200;
  }

  static async getMatchmaking({ roomId, displayName, baseUrl }: { roomId?: string; displayName: string; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking`, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: MatchmakingType.Guest, room_id: roomId, display_name: displayName }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as APIResponse).code };
      return { success: true as true, data: data as APIMatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: MessageCodes.UnexpectedError };
    }
  }

  static async getMatchmakingDiscord({ instanceId, code, baseUrl }: { instanceId: string; code: string; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking`, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: MatchmakingType.Discord, instance_id: instanceId, code }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as APIResponse).code };
      return { success: true as true, data: data as APIMatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: MessageCodes.UnexpectedError };
    }
  }

  static async getMinigame({ minigameId, baseUrl }: { minigameId: string; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/minigames/${encodeURIComponent(minigameId)}`);
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as APIResponse).code };
      return { success: true as true, data: data as Minigame };
    } catch (err) {
      console.error(err);
      return { success: false as false, code: MessageCodes.UnexpectedError };
    }
  }

  constructor({ iframe, targetOrigin = "*" }: { iframe: HTMLIFrameElement; targetOrigin?: string }) {
    this.iframe = iframe;
    this.targetOrigin = targetOrigin;

    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage, false);
  }
  private handleMessage({ source, data }: MessageEvent) {
    if (source !== this.iframe.contentWindow) return;

    if (!Array.isArray(data) || data.length !== 2 || !Object.values(MinigameOpcodes).includes(data[0])) {
      return console.error("Received an invalid data from the iframe:", data);
    }

    const opcode: MinigameOpcodes = data[0];
    const { success, data: payload } = MinigameValidation[opcode].safeParse(data[1]);
    if (!success) return console.error("Received an invalid payload from the iframe:", data);

    switch (opcode) {
      case MinigameOpcodes.Handshake:
        if (this.isReady) return console.error("Already recieved handshake from this minigame");
        this.isReady = true;
        this.emitter.emit(MinigameOpcodes.Handshake, payload);
        break;
      default:
        if (!this.isReady) return console.error("Recieved payload from minigame before handshake");
        this.emitter.emit(opcode, payload);
        break;
    }
  }
  private postMessage<O extends ParentOpcodes>(opcode: O, payload: ParentTypes[O]) {
    this.iframe.contentWindow?.postMessage([opcode, payload], this.targetOrigin);
  }

  on<O extends MinigameOpcodes>(evt: O, listener: (payload: z.infer<(typeof MinigameValidation)[O]>) => unknown) {
    return this.emitter.on(evt, listener);
  }
  once<O extends MinigameOpcodes>(evt: O, listener: (payload: z.infer<(typeof MinigameValidation)[O]>) => unknown) {
    return this.emitter.once(evt, listener);
  }
  off<O extends MinigameOpcodes>(evt: O, listener: (payload: z.infer<(typeof MinigameValidation)[O]>) => unknown) {
    return this.emitter.off(evt, listener);
  }

  confirmHandshake(payload: ParentTypes[ParentOpcodes.Ready]) {
    this.postMessage(ParentOpcodes.Ready, payload);
  }
  updateSettings(payload: ParentTypes[ParentOpcodes.UpdateSettings]) {
    this.postMessage(ParentOpcodes.UpdateSettings, payload);
  }
  setGameStarted(payload: ParentTypes[ParentOpcodes.StartGame]) {
    this.postMessage(ParentOpcodes.StartGame, payload);
  }
  readyPlayer(payload: ParentTypes[ParentOpcodes.MinigamePlayerReady]) {
    this.postMessage(ParentOpcodes.MinigamePlayerReady, payload);
  }
  removePlayer(payload: ParentTypes[ParentOpcodes.PlayerLeft]) {
    this.postMessage(ParentOpcodes.PlayerLeft, payload);
  }
  updateGameState(payload: ParentTypes[ParentOpcodes.UpdatedGameState]) {
    this.postMessage(ParentOpcodes.UpdatedGameState, payload);
  }
  updatePlayerState(payload: ParentTypes[ParentOpcodes.UpdatedPlayerState]) {
    this.postMessage(ParentOpcodes.UpdatedPlayerState, payload);
  }
  sendGameMessage(payload: ParentTypes[ParentOpcodes.ReceivedGameMessage]) {
    this.postMessage(ParentOpcodes.ReceivedGameMessage, payload);
  }
  sendPrivateMessage(payload: ParentTypes[ParentOpcodes.ReceivedPrivateMessage]) {
    this.postMessage(ParentOpcodes.ReceivedPrivateMessage, payload);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    this.emitter.removeAllListeners();
    window.removeEventListener("message", this.handleMessage);
  }
}
