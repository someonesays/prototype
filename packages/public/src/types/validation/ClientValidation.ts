import z from "zod";
import { ClientOpcodes, GameSelectPreviousOrNextMinigame, StateZod } from "../../types";

export const ClientValidation = {
  [ClientOpcodes.PING]: z.object({}),
  [ClientOpcodes.KICK_PLAYER]: z.object({ user: z.string().min(1).max(50) }),
  [ClientOpcodes.TRANSFER_HOST]: z.object({ user: z.string().min(1).max(50) }),
  [ClientOpcodes.SET_ROOM_SETTINGS]: z.object({
    packId: z.string().min(1).max(50).nullable(),
    minigameId: z.string().min(1).max(50).nullable(),
  }),
  [ClientOpcodes.SELECT_PREVIOUS_OR_NEXT_MINIGAME]: z.object({
    direction: z.nativeEnum(GameSelectPreviousOrNextMinigame),
  }),
  [ClientOpcodes.BEGIN_GAME]: z.object({}),
  [ClientOpcodes.MINIGAME_HANDSHAKE]: z.object({ roomHandshakeCount: z.number().optional() }),
  [ClientOpcodes.MINIGAME_END_GAME]: z.object({ force: z.boolean() }),
  [ClientOpcodes.MINIGAME_SET_GAME_STATE]: z.object({ state: StateZod }),
  [ClientOpcodes.MINIGAME_SET_PLAYER_STATE]: z.object({ user: z.string().min(1).max(50), state: StateZod }),
  [ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE]: z.object({ message: StateZod }),
  [ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE]: z.object({ message: StateZod }),
  [ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE]: z.object({
    user: z.string().min(1).max(50).optional(), // Defaults to host
    message: StateZod,
  }),
  [ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE]: z.instanceof(Uint8Array),
  [ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE]: z.instanceof(Uint8Array),
  [ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE]: z.object({
    user: z.string().min(1).max(50).optional(), // Defaults to host
    message: z.instanceof(Uint8Array),
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
  | ClientOpcodeAndData<ClientOpcodes.SELECT_PREVIOUS_OR_NEXT_MINIGAME>
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
