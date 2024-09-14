import z from "zod";
import { PromptOpcodes } from "../opcodes";
import { stateZod } from "./State";
import { GamePrize } from "../types";

export const PromptValidation = {
  [PromptOpcodes.Handshake]: z.object({}),
  [PromptOpcodes.EndGame]: z.object({
    // WIP: Add proper validation for the winner ID and participation IDs
    // WIP: Make sure to disallow repeating PrizeType.Winner, PrizeType.Second and PrizeType.Third
    prizes: z.array(
      z.object({
        id: z.string(),
        type: z.nativeEnum(GamePrize),
      }),
    ),
  }),
  [PromptOpcodes.SetGameState]: z.object({
    state: stateZod,
  }),
  [PromptOpcodes.SetPlayerState]: z.object({
    // WIP: Add proper validation for the player ID
    id: z.string(),
    state: stateZod,
  }),
  [PromptOpcodes.SendGameMessage]: z.object({
    message: stateZod,
  }),
  [PromptOpcodes.SendPlayerMessage]: z.object({
    // WIP: Add proper validation for the player ID
    id: z.string(),
    message: stateZod,
  }),
};
