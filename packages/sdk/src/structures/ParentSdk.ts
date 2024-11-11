import EventEmitter from "eventemitter3";
import { ParentOpcodes, MinigameOpcodes } from "../opcodes";
import { MinigameValidation, type Minigame, type ParentTypes } from "../types";
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

  static async getMinigame(minigameId: string, baseUrl = "") {
    try {
      const req = await fetch(`${baseUrl}/api/minigames/${encodeURIComponent(minigameId)}`);
      if (req.status !== 200) return { success: false };

      const minigame = (await req.json()) as Minigame;
      return { success: true, minigame };
    } catch (err) {
      return { success: false };
    }
  }

  constructor({ iframe }: { iframe: HTMLIFrameElement }) {
    this.iframe = iframe;
    this.handleMessage = this.handleMessage.bind(this);

    window.addEventListener("message", this.handleMessage, false);
  }
  private handleMessage({ data }: MessageEvent) {
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
  setGameStarted() {
    this.postMessage(ParentOpcodes.StartGame, {});
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
  sendPlayerMessage(payload: ParentTypes[ParentOpcodes.ReceivedPlayerMessage]) {
    this.postMessage(ParentOpcodes.ReceivedPlayerMessage, payload);
  }
  sendPrivateMessage(payload: ParentTypes[ParentOpcodes.ReceivedPrivateMessage]) {
    this.postMessage(ParentOpcodes.ReceivedPrivateMessage, payload);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    window.removeEventListener("message", this.handleMessage);
  }
}
