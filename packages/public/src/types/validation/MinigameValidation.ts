import z from "zod";
import { MinigameOpcodes, StateZod, GamePrizeArrayZod } from "../../types";

export const MinigameValidation = {
  [MinigameOpcodes.HANDSHAKE]: z.object({}),
  [MinigameOpcodes.END_GAME]: z.object({
    prizes: GamePrizeArrayZod,
  }),
  [MinigameOpcodes.SET_CLIENT_PROMPT]: z.object({
    prompt: z.string().min(1).max(500),
  }),
  [MinigameOpcodes.SET_GAME_STATE]: z.object({
    state: StateZod,
  }),
  [MinigameOpcodes.SET_PLAYER_STATE]: z.object({
    user: z.string().min(1).max(50),
    state: StateZod,
  }),
  [MinigameOpcodes.SEND_GAME_MESSAGE]: z.object({
    message: StateZod,
  }),
  [MinigameOpcodes.SEND_PLAYER_MESSAGE]: z.object({
    message: StateZod,
  }),
  [MinigameOpcodes.SEND_PRIVATE_MESSAGE]: z.object({
    user: z.string().min(1).max(50).optional(),
    message: StateZod,
  }),
};
