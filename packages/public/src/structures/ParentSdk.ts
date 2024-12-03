import EventEmitter from "eventemitter3";
import { ParentOpcodes, MinigameOpcodes, MinigameValidation, type ParentTypes } from "../types";
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

  constructor({ iframe, targetOrigin = "*" }: { iframe: HTMLIFrameElement; targetOrigin?: string }) {
    this.iframe = iframe;
    this.targetOrigin = targetOrigin;

    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage, false);
  }
  private handleMessage({ source, data }: MessageEvent) {
    if (source !== this.iframe.contentWindow || this.isDestroyed) return;

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
    if (this.isDestroyed) return;
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
