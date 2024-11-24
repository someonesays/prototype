import z from "zod";
import { ClientOpcodes, GamePrizeArrayZod, StateZod } from "../../types";

export const ClientValidation = {
  [ClientOpcodes.PING]: z.object({}),
  [ClientOpcodes.KICK_PLAYER]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.TRANSFER_HOST]: z.object({
    user: z.string().min(1).max(50),
  }),
  [ClientOpcodes.SET_ROOM_SETTINGS]: z.object({
    packId: z.string().min(1).max(50).nullable().optional(),
    minigameId: z.string().min(1).max(50).nullable().optional(),
  }),
  [ClientOpcodes.BEGIN_GAME]: z.object({}),
  [ClientOpcodes.MINIGAME_HANDSHAKE]: z.object({}),
  [ClientOpcodes.MINIGAME_END_GAME]: z.object({
    prizes: GamePrizeArrayZod.optional(),
  }),
  [ClientOpcodes.MINIGAME_SET_GAME_STATE]: z.object({
    state: StateZod,
  }),
  [ClientOpcodes.MINIGAME_SET_PLAYER_STATE]: z.object({
    user: z.string().min(1).max(50),
    state: StateZod,
  }),
  [ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE]: z.object({
    message: StateZod,
  }),
  [ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE]: z.object({
    user: z.string().min(1).max(50).optional(), // Defaults to host
    message: StateZod,
  }),
};

export interface ClientOpcodeAndData<O extends ClientOpcodes> {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}

export type ClientOpcodeAndDatas =
  | ClientOpcodeAndData<ClientOpcodes.PING>
  | ClientOpcodeAndData<ClientOpcodes.KICK_PLAYER>
  | ClientOpcodeAndData<ClientOpcodes.TRANSFER_HOST>
  | ClientOpcodeAndData<ClientOpcodes.SET_ROOM_SETTINGS>
  | ClientOpcodeAndData<ClientOpcodes.BEGIN_GAME>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_HANDSHAKE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_END_GAME>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SET_GAME_STATE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SET_PLAYER_STATE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE>;
