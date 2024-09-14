import EventEmitter from "eventemitter3";
import { ParentOpcodes, PromptOpcodes } from "../opcodes";
import type { ParentValidation, PromptValidation } from "../zod";
import type { z } from "zod";

export class PromptSdk {
  private isReady = false;
  private emitter = new EventEmitter();
  private source = window.parent.opener ?? window.parent;

  private targetOrigin = document.referrer || "*";

  constructor() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }
  private handleMessage<O extends ParentOpcodes>({
    origin,
    data,
  }: { origin: MessageEvent["origin"] } & { data: [O, z.infer<(typeof ParentValidation)[O]>] }) {
    if (new URL(origin).pathname !== new URL(this.targetOrigin).pathname) return;

    const [opcode, payload] = data;
    switch (opcode) {
      case ParentOpcodes.Ready: {
        this.emitter.emit(ParentOpcodes.Ready, payload);
      }
    }
  }
  private postMessage<O extends PromptOpcodes>(
    opcode: O,
    payload: z.infer<(typeof PromptValidation)[O]>,
  ) {
    this.source.postMessage([opcode, payload], this.targetOrigin);
  }

  ready(): Promise<z.infer<(typeof ParentValidation)[ParentOpcodes.Ready]>> {
    if (this.isReady) throw new Error("Already ready or requested to be ready");
    this.postMessage(PromptOpcodes.Ready, {});
    return new Promise((resolve) => this.emitter.once(ParentOpcodes.Ready, resolve));
  }
}
