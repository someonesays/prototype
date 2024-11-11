import z from "zod";
import { MinigameOpcodes } from "../opcodes";
import { StateZod } from "./State";
import { GamePrizeArrayZod } from "../types";

export const MinigameValidation = {
  [MinigameOpcodes.Handshake]: z.object({}),
  [MinigameOpcodes.EndGame]: z.object({
    prizes: GamePrizeArrayZod,
  }),
  [MinigameOpcodes.SetClientPrompt]: z.object({
    prompt: z.string(),
  }),
  [MinigameOpcodes.SetGameState]: z.object({
    state: StateZod,
  }),
  [MinigameOpcodes.SetPlayerState]: z.object({
    user: z.string().min(1).max(50),
    state: StateZod,
  }),
  [MinigameOpcodes.SendGameMessage]: z.object({
    message: StateZod,
  }),
  [MinigameOpcodes.SendPlayerMessage]: z.object({
    user: z.string().min(1).max(50),
    message: StateZod,
  }),
  [MinigameOpcodes.SendPrivateMessage]: z.object({
    user: z.string().min(1).max(50),
    message: StateZod,
  }),
};
