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
  [ClientOpcodes.PromptHandshake]: z.object({}),
  [ClientOpcodes.PromptEndGame]: z.object({}),
  [ClientOpcodes.PromptSetGameState]: z.object({}),
  [ClientOpcodes.PromptSetPlayerState]: z.object({}),
  [ClientOpcodes.PromptSetGameMessage]: z.object({}),
  [ClientOpcodes.PromptSetPlayerMessage]: z.object({}),
};
