import z from "zod";
import { ClientOpcodes, GamePrizeArrayZod, StateZod } from "../../types";

export const ClientValidation = {
  [ClientOpcodes.Ping]: z.object({}),
  [ClientOpcodes.KickPlayer]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.TransferHost]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.SetRoomSettings]: z.object({
    pack_id: z.string().min(1).max(50).nullable().optional(),
    minigame_id: z.string().min(1).max(50).nullable().optional(),
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
  [ClientOpcodes.MinigameSendPrivateMessage]: z.object({
    to_user: z.string().min(1).max(50).optional(), // Defaults to host
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
  | ClientOpcodeAndData<ClientOpcodes.MinigameSendPrivateMessage>;
