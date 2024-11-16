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
      // https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
      if (window.self === window.top) throw new Error();
    } catch (e) {
      throw new Error("Failed to initiate MinigameSdk. Are you running this minigame inside the game?");
    }

    window.addEventListener("message", this.handleMessage.bind(this), false);
  }
  private handleMessage<O extends ParentOpcodes>({
    origin,
    data,
  }: { origin: MessageEvent["origin"] } & { data: [O, ParentTypes[O]] }) {
    if (new URL(origin).pathname !== new URL(this.targetOrigin).pathname) return;

    const [opcode, payload] = data;
    switch (opcode) {
      case ParentOpcodes.Ready:
        this.isReady = true;
        this.isWaiting = false;
        this.emitter.emit(ParentOpcodes.Ready, payload);
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

  ready(): Promise<ParentTypes[ParentOpcodes.Ready]> {
    if (this.isReady || this.isWaiting) throw new Error("Already ready or requested to be ready");

    this.isWaiting = true;
    this.postMessage(MinigameOpcodes.Handshake, {});
    return new Promise((resolve) => this.once(ParentOpcodes.Ready, resolve));
  }
  endGame(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.EndGame]>) {
    this.postMessage(MinigameOpcodes.EndGame, payload);
  }
  setGameState(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SetGameState]>) {
    this.postMessage(MinigameOpcodes.SetGameState, payload);
  }
  setPlayerState(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SetPlayerState]>) {
    this.postMessage(MinigameOpcodes.SetPlayerState, payload);
  }
  sendGameMessage(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SendGameMessage]>) {
    this.postMessage(MinigameOpcodes.SendGameMessage, payload);
  }
  sendPrivateMessage(payload: z.infer<(typeof MinigameValidation)[MinigameOpcodes.SendPrivateMessage]>) {
    this.postMessage(MinigameOpcodes.SendPrivateMessage, payload);
  }
}
