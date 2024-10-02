import z from "zod";
import { ClientOpcodes } from "../opcodes";
import { GamePrizeArrayZod } from "./GamePrize";
import { StateZod } from "./State";

export const ClientValidation = {
  [ClientOpcodes.KickPlayer]: z.object({
    player: z.string(),
  }),
  [ClientOpcodes.TransferHost]: z.object({
    player: z.string(),
  }),
  [ClientOpcodes.SetRoomSettings]: z.object({
    name: z.string().min(1).max(50),
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
    user: z.string(),
    state: StateZod,
  }),
  [ClientOpcodes.MinigameSendGameMessage]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MinigameSendPlayerMessage]: z.object({
    user: z.string(),
    message: StateZod,
  }),
  [ClientOpcodes.MinigameSendPrivateMessage]: z.object({
    user: z.string(),
    toUser: z.string().optional(), // Defaults to host
    message: StateZod,
  }),
};

export interface ClientOpcodeAndData<O extends ClientOpcodes> {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}

export type ClientOpcodeAndDatas =
  | ClientOpcodeAndData<ClientOpcodes.KickPlayer>
  | ClientOpcodeAndData<ClientOpcodes.TransferHost>
  | ClientOpcodeAndData<ClientOpcodes.SetRoomSettings>
  | ClientOpcodeAndData<ClientOpcodes.BeginGame>
  | ClientOpcodeAndData<ClientOpcodes.EndGame>
  | ClientOpcodeAndData<ClientOpcodes.MinigameHandshake>
  | ClientOpcodeAndData<ClientOpcodes.MinigameEndGame>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSetGameState>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSetPlayerState>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendGameMessage>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendPlayerMessage>
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendPrivateMessage>;
