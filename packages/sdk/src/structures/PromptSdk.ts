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
    if (window.self === window.top) {
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
      case ParentOpcodes.Ready: {
        this.isReady = true;
        this.emitter.emit(ParentOpcodes.Ready, payload);
        break;
      }
      case ParentOpcodes.StartGame: {
        break;
      }
      case ParentOpcodes.PlayerJoined: {
        break;
      }
      case ParentOpcodes.PlayerLeft: {
        break;
      }
      case ParentOpcodes.UpdatedGameState: {
        break;
      }
      case ParentOpcodes.UpdatedPlayerState: {
        break;
      }
      case ParentOpcodes.ReceivedGameMessage: {
        break;
      }
      case ParentOpcodes.ReceivedPlayerMessage: {
        break;
      }
    }
  }
  private postMessage<O extends PromptOpcodes>(
    opcode: O,
    payload: z.infer<(typeof PromptValidation)[O]>,
  ) {
    this.source.postMessage([opcode, payload], this.targetOrigin);
  }

  ready(): Promise<ParentTypes[ParentOpcodes.Ready]> {
    if (this.isReady) throw new Error("Already ready or requested to be ready");
    this.postMessage(PromptOpcodes.Handshake, {});
    return new Promise((resolve) => this.emitter.once(ParentOpcodes.Ready, resolve));
  }
}
