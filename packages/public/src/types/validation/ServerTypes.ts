import type {
  ServerOpcodes,
  MinigameEndReason,
  GamePlayer,
  GameRoomPrivate,
  GameStatus,
  Minigame,
  State,
} from "../../types";

export interface ServerTypes {
  [ServerOpcodes.PING]: null;
  [ServerOpcodes.ERROR]: string;
  [ServerOpcodes.GET_INFORMATION]: {
    status: GameStatus;
    user: number; // (user = player id)
    room: GameRoomPrivate;
    minigame: Minigame | null;
    players: GamePlayer[];
  };
  [ServerOpcodes.PLAYER_JOIN]: GamePlayer;
  [ServerOpcodes.PLAYER_LEFT]: number;
  [ServerOpcodes.TRANSFER_HOST]: number;
  [ServerOpcodes.UPDATED_ROOM_SETTINGS]: { minigame: Minigame | null };
  [ServerOpcodes.LOAD_MINIGAME]: { players: GamePlayer[]; roomHandshakeCount: number };
  [ServerOpcodes.END_MINIGAME]:
    | {
        players: GamePlayer[];
        reason:
          | MinigameEndReason.FORCEFUL_END
          | MinigameEndReason.HOST_LEFT
          | MinigameEndReason.FAILED_TO_SATISFY_MINIMUM_PLAYERS_TO_START;
      }
    | {
        players: GamePlayer[];
        reason: MinigameEndReason.MINIGAME_ENDED;
      };
  [ServerOpcodes.MINIGAME_PLAYER_READY]: number;
  [ServerOpcodes.MINIGAME_START_GAME]: null;
  [ServerOpcodes.MINIGAME_SET_GAME_STATE]: State;
  [ServerOpcodes.MINIGAME_SET_PLAYER_STATE]: [number, State]; // [user, state]
  [ServerOpcodes.MINIGAME_SEND_GAME_MESSAGE]: State;
  [ServerOpcodes.MINIGAME_SEND_PLAYER_MESSAGE]: [number, State]; // [user, message]
  [ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE]: [number, number, State]; // [fromUser - user who sent it, toUser - who it was sent by (mainly for the host), message]
  [ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE]: Uint8Array;
  [ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE]: [number, Uint8Array];
  [ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE]: [number, number, Uint8Array]; // [fromUser - user who sent it, toUser - who it was sent by (mainly for the host), message]
}

export interface ServerOpcodeAndData<O extends ServerOpcodes> {
  opcode: O;
  data: ServerTypes[O];
}

export type ServerOpcodeAndDatas =
  | ServerOpcodeAndData<ServerOpcodes.PING>
  | ServerOpcodeAndData<ServerOpcodes.ERROR>
  | ServerOpcodeAndData<ServerOpcodes.GET_INFORMATION>
  | ServerOpcodeAndData<ServerOpcodes.PLAYER_JOIN>
  | ServerOpcodeAndData<ServerOpcodes.PLAYER_LEFT>
  | ServerOpcodeAndData<ServerOpcodes.TRANSFER_HOST>
  | ServerOpcodeAndData<ServerOpcodes.UPDATED_ROOM_SETTINGS>
  | ServerOpcodeAndData<ServerOpcodes.LOAD_MINIGAME>
  | ServerOpcodeAndData<ServerOpcodes.END_MINIGAME>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_PLAYER_READY>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_START_GAME>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SET_GAME_STATE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SET_PLAYER_STATE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_GAME_MESSAGE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_PLAYER_MESSAGE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE>;
