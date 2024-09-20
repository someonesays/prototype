import EventEmitter from "eventemitter3";
import { ParentOpcodes, PromptOpcodes } from "../opcodes";
import type { ParentTypes, PromptValidation } from "../types";
import type { z } from "zod";

export class PromptSdk {
  private isReady = false;
  private emitter = new EventEmitter<ParentOpcodes>();
  private source = window.parent.opener ?? window.parent;
  private targetOrigin = document.referrer || "*";

  constructor() {
    try {
      // https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
      if (window.self === window.top) throw new Error();
    } catch (e) {
      throw new Error("Failed to initiate PromptSdk. Are you running this prompt inside the game?");
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
        this.emitter.emit(ParentOpcodes.Ready, payload);
        break;
      default:
        this.emitter.emit(opcode, payload);
        break;
    }
  }
  private postMessage<O extends PromptOpcodes>(
    opcode: O,
    payload: z.infer<(typeof PromptValidation)[O]>,
  ) {
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
    if (this.isReady) throw new Error("Already ready or requested to be ready");
    this.postMessage(PromptOpcodes.Handshake, {});
    return new Promise((resolve) => this.emitter.once(ParentOpcodes.Ready, resolve));
  }
  endGame(payload: z.infer<(typeof PromptValidation)[PromptOpcodes.EndGame]>) {
    this.postMessage(PromptOpcodes.EndGame, payload);
  }
  setGameState(payload: z.infer<(typeof PromptValidation)[PromptOpcodes.SetGameState]>) {
    this.postMessage(PromptOpcodes.SetGameState, payload);
  }
  setPlayerState(payload: z.infer<(typeof PromptValidation)[PromptOpcodes.SetPlayerState]>) {
    this.postMessage(PromptOpcodes.SetPlayerState, payload);
  }
  sendGameMessage(payload: z.infer<(typeof PromptValidation)[PromptOpcodes.SendGameMessage]>) {
    this.postMessage(PromptOpcodes.SendGameMessage, payload);
  }
  sendPlayerMessage(payload: z.infer<(typeof PromptValidation)[PromptOpcodes.SendPlayerMessage]>) {
    this.postMessage(PromptOpcodes.SendPlayerMessage, payload);
  }
}
