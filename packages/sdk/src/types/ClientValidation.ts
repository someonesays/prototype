import z from "zod";
import { ClientOpcodes } from "../opcodes";

export const ClientValidation = {
  [ClientOpcodes.Ping]: z.object({}),
  [ClientOpcodes.ChatMessage]: z.object({}),
  [ClientOpcodes.KickPlayer]: z.object({}),
  [ClientOpcodes.TransferHost]: z.object({}),
  [ClientOpcodes.SetRoomSettings]: z.object({}),
  [ClientOpcodes.BeginGame]: z.object({}),
  [ClientOpcodes.EndGame]: z.object({}),
  [ClientOpcodes.MinigameHandshake]: z.object({}),
  [ClientOpcodes.MinigameEndGame]: z.object({}),
  [ClientOpcodes.MinigameSetGameState]: z.object({}),
  [ClientOpcodes.MinigameSetPlayerState]: z.object({}),
  [ClientOpcodes.MinigameSetGameMessage]: z.object({}),
  [ClientOpcodes.MinigameSetPlayerMessage]: z.object({}),
};
