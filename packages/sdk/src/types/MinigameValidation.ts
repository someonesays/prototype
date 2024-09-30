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
    // TODO: Add proper validation for the player ID
    user: z.string(),
    state: StateZod,
  }),
  [MinigameOpcodes.SendGameMessage]: z.object({
    message: StateZod,
  }),
  [MinigameOpcodes.SendPlayerMessage]: z.object({
    // TODO: Add proper validation for the player ID
    user: z.string(),
    message: StateZod,
  }),
  [MinigameOpcodes.SendPrivateMessage]: z.object({
    // TODO: Add proper validation for the player ID
    user: z.string(),
    message: StateZod,
  }),
};
