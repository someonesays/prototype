import z from "zod";
import { MinigameOpcodes } from "../opcodes";
import { stateZod } from "./State";
import { GamePrize } from "../types";

export const MinigameValidation = {
  [MinigameOpcodes.Handshake]: z.object({}),
  [MinigameOpcodes.EndGame]: z.object({
    // WIP: Add proper validation for the winner ID and participation IDs
    // WIP: Make sure to disallow repeating PrizeType.Winner, PrizeType.Second and PrizeType.Third
    prizes: z.array(
      z.object({
        id: z.string(),
        type: z.nativeEnum(GamePrize),
      }),
    ),
  }),
  [MinigameOpcodes.SetGameState]: z.object({
    state: stateZod,
  }),
  [MinigameOpcodes.SetPlayerState]: z.object({
    // WIP: Add proper validation for the player ID
    id: z.string(),
    state: stateZod,
  }),
  [MinigameOpcodes.SendGameMessage]: z.object({
    message: stateZod,
  }),
  [MinigameOpcodes.SendPlayerMessage]: z.object({
    // WIP: Add proper validation for the player ID
    id: z.string(),
    message: stateZod,
  }),
};
