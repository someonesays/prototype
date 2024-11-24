import EventEmitter from "eventemitter3";
import { ParentOpcodes, MinigameOpcodes, type ParentTypes, type MinigameValidation } from "../types";
import type { z } from "zod";

export class MinigameSdk {
  private isReady = false;
  private isWaiting = false;

  private emitter = new EventEmitter<ParentOpcodes>();
  private source = window.parent.opener ?? window.parent;
  private targetOrigin = document.referrer || "*";

  constructor() {
    try {
      if (window.self === window.top) throw new Error();
    } catch (e) {
      throw new Error("Failed to initiate MinigameSdk. Are you running this minigame inside the game?");
    }

    window.addEventListener("message", this.handleMessage.bind(this), false);
  }
  private handleMessage<O extends ParentOpcodes>({
    source,
    data,
  }: { source: MessageEvent["source"] } & { data: [O, ParentTypes[O]] }) {
    if (this.source !== source) return;

    const [opcode, payload] = data;
    switch (opcode) {
      case ParentOpcodes.READY:
        this.isReady = true;
        this.isWaiting = false;
        this.emitter.emit(ParentOpcodes.READY, payload);
        break;
      default:
        this.emitter.emit(opcode, payload);
        break;
    }
  }
  private postMessage<O extends MinigameOpcodes>(opcode: O, payload: z.infer<(typeof MinigameValidation)[O]>) {
    this.source.postMessage([opcode, payload], this.targetOrigin);
  }

  on<O extends ParentOpcodes>(evt: O, listener: (payload: ParentTypes[O]) => unknown) {
    return this.emitter.on(evt, listener);
  }
  once<O extends ParentOpcodes>(evt: O, listener: (payload: ParentTypes[O]) => unknown) {
    return this.emitter.once(evt, listener);
  }
  off<O extends ParentOpcodes>(evt: O, listener: (payload: ParentTypes[O]) => unknown) {
    return this.emitter.off(evt, listener);
  }

  ready(): Promise<ParentTypes[ParentOpcodes.READY]> {
    if (this.isReady || this.isWaiting) throw new Error("Already ready or requested to be ready");

    this.isWaiting = true;
    this.postMessage(MinigameOpcodes.HANDSHAKE, {});
    return new Promise((resolve) => this.once(ParentOpcodes.READY, resolve));
  }
  endGame(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.END_GAME]>) {
    this.postMessage(MinigameOpcodes.END_GAME, payload);
  }
  setClientPrompt(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SET_CLIENT_PROMPT]>) {
    this.postMessage(MinigameOpcodes.SET_CLIENT_PROMPT, payload);
  }
  setGameState(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SET_GAME_STATE]>) {
    this.postMessage(MinigameOpcodes.SET_GAME_STATE, payload);
  }
  setPlayerState(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SET_PLAYER_STATE]>) {
    this.postMessage(MinigameOpcodes.SET_PLAYER_STATE, payload);
  }
  sendGameMessage(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SEND_GAME_MESSAGE]>) {
    this.postMessage(MinigameOpcodes.SEND_GAME_MESSAGE, payload);
  }
  sendPlayerMessage(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SEND_PLAYER_MESSAGE]>) {
    this.postMessage(MinigameOpcodes.SEND_PLAYER_MESSAGE, payload);
  }
  sendPrivateMessage(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SEND_PRIVATE_MESSAGE]>) {
    this.postMessage(MinigameOpcodes.SEND_PRIVATE_MESSAGE, payload);
  }
}
