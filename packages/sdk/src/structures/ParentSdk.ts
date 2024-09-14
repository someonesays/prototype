import type { z } from "zod";
import { ParentOpcodes, PromptOpcodes } from "../opcodes";
import { PromptValidation, type ParentValidation } from "../zod";
import type { Visibility } from "@/public";

/**
 * This is the parent SDK for Someone Says.
 * You want to initiate this class every time you load a new prompt.
 */
export class ParentSdk {
  private iframe: HTMLIFrameElement;
  private isReady = false;
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
    window.addEventListener("message", this.handleMessage.bind(this));
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
      case PromptOpcodes.Handshake: {
        if (this.isReady) return console.error("Already recieved handshake from this prompt");
        this.isReady = true;
        this.postMessage(ParentOpcodes.Ready, { test: "test" });
        break;
      }
      case PromptOpcodes.EndGame: {
        break;
      }
      case PromptOpcodes.SetGameState: {
        break;
      }
      case PromptOpcodes.SetUserState: {
        break;
      }
      case PromptOpcodes.SendGameMessage: {
        break;
      }
      case PromptOpcodes.SendUserMessage: {
        break;
      }
    }
  }
  private postMessage<O extends ParentOpcodes>(
    opcode: O,
    payload: z.infer<(typeof ParentValidation)[O]>,
  ) {
    this.iframe.contentWindow?.postMessage([opcode, payload], this.targetOrigin);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    window.removeEventListener("message", this.handleMessage);
  }
}
