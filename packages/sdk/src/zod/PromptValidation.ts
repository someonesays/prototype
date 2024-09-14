import z from "zod";
import { PromptOpcodes } from "../opcodes";

export const PromptValidation = {
  [PromptOpcodes.Ping]: z.object({}),
  [PromptOpcodes.Ready]: z.object({}),
  [PromptOpcodes.EndGame]: z.object({}),
  [PromptOpcodes.SetGameState]: z.object({}),
  [PromptOpcodes.SetUserState]: z.object({}),
  [PromptOpcodes.SendGameMessage]: z.object({}),
  [PromptOpcodes.SendUserMessage]: z.object({}),
};
