import z from "zod";
import { ClientOpcodes } from "../opcodes";
import { GamePrizeArrayZod } from "./GamePrize";
import { StateZod } from "./State";

export const ClientValidation = {
  [ClientOpcodes.Ping]: z.object({}),
  [ClientOpcodes.KickPlayer]: z.object({
    player: z.string(),
  }),
  [ClientOpcodes.TransferHost]: z.object({
    player: z.string(),
  }),
  [ClientOpcodes.SetRoomSettings]: z.object({
    // WIP: Add options to set room settings
  }),
  [ClientOpcodes.BeginGame]: z.object({}),
  [ClientOpcodes.EndGame]: z.object({}),
  [ClientOpcodes.MinigameHandshake]: z.object({}),
  [ClientOpcodes.MinigameEndGame]: z.object({
    prizes: GamePrizeArrayZod,
  }),
  [ClientOpcodes.MinigameSetGameState]: z.object({
    state: StateZod,
  }),
  [ClientOpcodes.MinigameSetPlayerState]: z.object({
    // WIP: Add proper validation for the player ID
    user: z.string(),
    state: StateZod,
  }),
  [ClientOpcodes.MinigameSetGameMessage]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MinigameSetPlayerMessage]: z.object({
    // WIP: Add proper validation for the player ID
    user: z.string(),
    message: StateZod,
  }),
};
