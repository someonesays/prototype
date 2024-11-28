import type {
  ServerOpcodes,
  MinigameEndReason,
  GamePlayer,
  GamePrize,
  GameRoomPrivate,
  GameStatus,
  Minigame,
  State,
  Pack,
} from "../../types";

export interface ServerTypes {
  [ServerOpcodes.PING]: {};
  [ServerOpcodes.ERROR]: { code: string };
  [ServerOpcodes.GET_INFORMATION]: {
    status: GameStatus;
    user: string; // (user = player id)
    room: GameRoomPrivate;
    pack: Pack | null;
    minigame: Minigame | null;
    players: GamePlayer[];
  };
  [ServerOpcodes.PLAYER_JOIN]: { player: GamePlayer };
  [ServerOpcodes.PLAYER_LEFT]: { user: string };
  [ServerOpcodes.TRANSFER_HOST]: { user: string };
  [ServerOpcodes.UPDATED_ROOM_SETTINGS]: { pack: Pack | null; minigame: Minigame | null };
  [ServerOpcodes.LOAD_MINIGAME]: { players: GamePlayer[] };
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
        prizes: GamePrize[];
      };
  [ServerOpcodes.MINIGAME_PLAYER_READY]: { user: string };
  [ServerOpcodes.MINIGAME_START_GAME]: {};
  [ServerOpcodes.MINIGAME_SET_GAME_STATE]: { state: State };
  [ServerOpcodes.MINIGAME_SET_PLAYER_STATE]: { user: string; state: State };
  [ServerOpcodes.MINIGAME_SEND_GAME_MESSAGE]: { message: State };
  [ServerOpcodes.MINIGAME_SEND_PLAYER_MESSAGE]: { user: string; message: State };
  [ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE]: {
    fromUser: string; // User who sent it
    toUser: string; // Who it was sent by (mainly for the host)
    message: State;
  };
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
  | ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE>;
