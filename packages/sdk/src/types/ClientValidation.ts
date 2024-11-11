import z from "zod";
import { ClientOpcodes } from "../opcodes";
import { GamePrizeArrayZod } from "./GamePrize";
import { StateZod } from "./State";

export const ClientValidation = {
  [ClientOpcodes.Ping]: z.object({}),
  [ClientOpcodes.KickPlayer]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.TransferHost]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.SetRoomSettings]: z.object({
    name: z.string().min(1).max(50).optional(),
    minigameId: z.string().min(1).max(50).nullable().optional(),
  }),
  [ClientOpcodes.BeginGame]: z.object({}),
  [ClientOpcodes.MinigameHandshake]: z.object({}),
  [ClientOpcodes.MinigameEndGame]: z.object({
    prizes: GamePrizeArrayZod.optional(),
  }),
  [ClientOpcodes.MinigameSetGameState]: z.object({
    state: StateZod,
  }),
  [ClientOpcodes.MinigameSetPlayerState]: z.object({
    user: z.string().min(1).max(50),
    state: StateZod,
  }),
  [ClientOpcodes.MinigameSendGameMessage]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MinigameSendPlayerMessage]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MinigameSendPrivateMessage]: z.object({
    toUser: z.string().min(1).max(50).optional(), // Defaults to host
    message: StateZod,
  }),
};

export interface ClientOpcodeAndData<O extends ClientOpcodes> {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}

export type ClientOpcodeAndDatas =
  | ClientOpcodeAndData<ClientOpcodes.Ping>
  | ClientOpcodeAndData<ClientOpcodes.KickPlayer>
  | ClientOpcodeAndData<ClientOpcodes.TransferHost>
  | ClientOpcodeAndData<ClientOpcodes.SetRoomSettings>
  | ClientOpcodeAndData<ClientOpcodes.BeginGame>
  | ClientOpcodeAndData<ClientOpcodes.MinigameHandshake>
  | ClientOpcodeAndData<ClientOpcodes.MinigameEndGame>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSetGameState>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSetPlayerState>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendGameMessage>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendPlayerMessage>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendPrivateMessage>;
