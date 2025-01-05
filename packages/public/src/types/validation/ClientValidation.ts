import z from "zod";
import { ClientOpcodes, StateZod } from "../../types";

export const ClientValidation = {
  [ClientOpcodes.PING]: z.object({}),
  [ClientOpcodes.KICK_PLAYER]: z.number().min(0).max(99),
  [ClientOpcodes.TRANSFER_HOST]: z.number().min(0).max(99),
  [ClientOpcodes.SET_ROOM_SETTINGS]: z.object({
    minigameId: z.string().min(1).max(50).nullable().optional(),
  }),
  [ClientOpcodes.BEGIN_GAME]: z.null().optional(),
  [ClientOpcodes.MINIGAME_HANDSHAKE]: z.number().nullable().optional(),
  [ClientOpcodes.MINIGAME_END_GAME]: z.boolean(),
  [ClientOpcodes.MINIGAME_SET_GAME_STATE]: StateZod,
  [ClientOpcodes.MINIGAME_SET_PLAYER_STATE]: z.tuple([z.number().min(0).max(99), StateZod]),
  [ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE]: StateZod,
  [ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE]: StateZod,
  [ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE]: z.tuple([
    StateZod,
    // Defaults to host
    z
      .number()
      .min(0)
      .max(99)
      .nullable()
      .optional(),
  ]),
  [ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE]: z.instanceof(Uint8Array),
  [ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE]: z.instanceof(Uint8Array),
  [ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE]: z.tuple([
    z.instanceof(Uint8Array),
    // Defaults to host
    z
      .number()
      .min(0)
      .max(99)
      .nullable()
      .optional(),
  ]),
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
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>
  | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE>;
