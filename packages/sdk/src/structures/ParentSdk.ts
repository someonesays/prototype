import EventEmitter from "eventemitter3";
import { ParentOpcodes, PromptOpcodes } from "../opcodes";
import { PromptValidation, type ParentTypes } from "../types";
import type { Visibility } from "@/public";
import type { z } from "zod";

/**
 * This is the parent SDK for Someone Says.
 * You want to initiate this class every time you load a new prompt.
 */
export class ParentSdk {
  public isReady = false;

  private emitter = new EventEmitter<PromptOpcodes>();
  private iframe: HTMLIFrameElement;
  private isDestroyed = false;
  private targetOrigin = "*";

  static async getPrompt(promptId: string) {
    try {
      const req = await fetch(`/api/prompts/${encodeURIComponent(promptId)}`);
      if (req.status !== 200) return { success: false };

      const prompt = (await req.json()) as {
        id: string;
        visibility: Visibility;
        prompt: string;
        author: {
          name: string;
        };
        url: string;
        createdAt: string;
        updatedAt: string;
      };

      return { success: true, prompt };
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
    if (
      !Array.isArray(data) ||
      data.length !== 2 ||
      !Object.values(PromptOpcodes).includes(data[0])
    ) {
      return console.error("Received an invalid data from the iframe:", data);
    }

    const opcode: PromptOpcodes = data[0];
    const { success, data: payload } = PromptValidation[opcode].safeParse(data[1]);
    if (!success) return console.error("Received an invalid payload from the iframe:", data);

    switch (opcode) {
      case PromptOpcodes.Handshake:
        if (this.isReady) return console.error("Already recieved handshake from this prompt");
        this.isReady = true;
        this.emitter.emit(PromptOpcodes.Handshake, payload);
        break;
      default:
        if (!this.isReady) return console.error("Recieved payload from prompt before handshake");
        this.emitter.emit(opcode, payload);
        break;
    }
  }
  private postMessage<O extends ParentOpcodes>(opcode: O, payload: ParentTypes[O]) {
    this.iframe.contentWindow?.postMessage([opcode, payload], this.targetOrigin);
  }

  on<O extends PromptOpcodes>(
    evt: O,
    listener: (payload: z.infer<(typeof PromptValidation)[O]>) => unknown,
  ) {
    return this.emitter.on(evt, listener);
  }
  once<O extends PromptOpcodes>(
    evt: O,
    listener: (payload: z.infer<(typeof PromptValidation)[O]>) => unknown,
  ) {
    return this.emitter.once(evt, listener);
  }
  off<O extends PromptOpcodes>(
    evt: O,
    listener: (payload: z.infer<(typeof PromptValidation)[O]>) => unknown,
  ) {
    return this.emitter.off(evt, listener);
  }

  confirmHandshake(payload: ParentTypes[ParentOpcodes.Ready]) {
    this.postMessage(ParentOpcodes.Ready, payload);
  }
  setGameStarted() {
    this.postMessage(ParentOpcodes.StartGame, { started: true });
  }
  readyPlayer(payload: ParentTypes[ParentOpcodes.PlayerReady]) {
    this.postMessage(ParentOpcodes.PlayerReady, payload);
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

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    window.removeEventListener("message", this.handleMessage);
  }
}
