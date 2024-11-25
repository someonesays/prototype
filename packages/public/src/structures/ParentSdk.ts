import EventEmitter from "eventemitter3";
import {
  ParentOpcodes,
  MinigameOpcodes,
  MinigameValidation,
  ErrorMessageCodes,
  MatchmakingType,
  MatchmakingLocation,
  type Minigame,
  type ParentTypes,
  type ApiErrorResponse,
  type MatchmakingResponse,
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
    const res = await fetch(`${baseUrl}/api/matchmaking?roomId=${encodeURIComponent(roomId)}`);
    return res.status === 200;
  }

  static async getMatchmaking({
    captcha,
    displayName,
    location,
    roomId,
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
          displayName: displayName,
        }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as MatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
    }
  }

  static async getMatchmakingDiscord({ instanceId, code, baseUrl }: { instanceId: string; code: string; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/matchmaking`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: MatchmakingType.DISCORD, instanceId, code }),
      });
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as MatchmakingResponse };
    } catch (err) {
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
    }
  }

  static async getMinigame({ minigameId, baseUrl }: { minigameId: string; baseUrl: string }) {
    try {
      const res = await fetch(`${baseUrl}/api/minigames/${encodeURIComponent(minigameId)}`);
      const data = await res.json();

      if (res.status !== 200) return { success: false as false, code: (data as ApiErrorResponse).code };
      return { success: true as true, data: data as Minigame };
    } catch (err) {
      console.error(err);
      return { success: false as false, code: ErrorMessageCodes.UNEXPECTED_ERROR };
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
      case MinigameOpcodes.HANDSHAKE:
        if (this.isReady) return console.error("Already recieved handshake from this minigame");
        this.isReady = true;
        this.emitter.emit(MinigameOpcodes.HANDSHAKE, payload);
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

  confirmHandshake(payload: ParentTypes[ParentOpcodes.READY]) {
    this.postMessage(ParentOpcodes.READY, payload);
  }
  updateSettings(payload: ParentTypes[ParentOpcodes.UPDATE_SETTINGS]) {
    this.postMessage(ParentOpcodes.UPDATE_SETTINGS, payload);
  }
  setGameStarted(payload: ParentTypes[ParentOpcodes.START_GAME]) {
    this.postMessage(ParentOpcodes.START_GAME, payload);
  }
  readyPlayer(payload: ParentTypes[ParentOpcodes.MINIGAME_PLAYER_READY]) {
    this.postMessage(ParentOpcodes.MINIGAME_PLAYER_READY, payload);
  }
  removePlayer(payload: ParentTypes[ParentOpcodes.PLAYER_LEFT]) {
    this.postMessage(ParentOpcodes.PLAYER_LEFT, payload);
  }
  updateGameState(payload: ParentTypes[ParentOpcodes.UPDATED_GAME_STATE]) {
    this.postMessage(ParentOpcodes.UPDATED_GAME_STATE, payload);
  }
  updatePlayerState(payload: ParentTypes[ParentOpcodes.UPDATED_PLAYER_STATE]) {
    this.postMessage(ParentOpcodes.UPDATED_PLAYER_STATE, payload);
  }
  sendGameMessage(payload: ParentTypes[ParentOpcodes.RECEIVED_GAME_MESSAGE]) {
    this.postMessage(ParentOpcodes.RECEIVED_GAME_MESSAGE, payload);
  }
  sendPlayerMessage(payload: ParentTypes[ParentOpcodes.RECEIVED_PLAYER_MESSAGE]) {
    this.postMessage(ParentOpcodes.RECEIVED_PLAYER_MESSAGE, payload);
  }
  sendPrivateMessage(payload: ParentTypes[ParentOpcodes.RECEIVED_PRIVATE_MESSAGE]) {
    this.postMessage(ParentOpcodes.RECEIVED_PRIVATE_MESSAGE, payload);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    this.emitter.removeAllListeners();
    window.removeEventListener("message", this.handleMessage);
  }
}
