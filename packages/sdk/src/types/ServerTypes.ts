import { ServerOpcodes } from "../opcodes";
import type {
  MinigameEndReason,
  GamePlayer,
  GamePrize,
  GameRoomPrivate,
  GameRoomSettings,
  GameStatus,
  Minigame,
  State,
} from "../types";

export interface ServerTypes {
  [ServerOpcodes.Error]: {
    message: string;
  };
  [ServerOpcodes.GetInformation]: {
    status: GameStatus;
    user: string; // (user = player id)
    room: GameRoomPrivate;
    minigame: Minigame | null;
    players: GamePlayer[];
  };
  [ServerOpcodes.PlayerJoin]: {
    player: GamePlayer;
  };
  [ServerOpcodes.PlayerLeft]: {
    user: string;
  };
  [ServerOpcodes.TransferHost]: {
    user: string;
  };
  [ServerOpcodes.UpdatedRoomSettings]: {
    room: GameRoomSettings;
    minigame: Minigame | null;
  };
  [ServerOpcodes.LoadMinigame]: {
    players: GamePlayer[];
    minigame: Minigame;
  };
  [ServerOpcodes.EndMinigame]:
    | {
        players: GamePlayer[];
        reason:
          | MinigameEndReason.ForcefulEnd
          | MinigameEndReason.HostLeft
          | MinigameEndReason.FailedToSatisfyMinimumPlayersToStart;
      }
    | {
        players: GamePlayer[];
        reason: MinigameEndReason.MinigameEnded;
        prizes: GamePrize[];
      };
  [ServerOpcodes.MinigamePlayerReady]: {
    user: string;
  };
  // biome-ignore lint/complexity/noBannedTypes: Doesn't need to send anything over
  [ServerOpcodes.MinigameStartGame]: {};
  [ServerOpcodes.MinigameSetGameState]: {
    state: State;
  };
  [ServerOpcodes.MinigameSetPlayerState]: {
    user: string;
    state: State;
  };
  [ServerOpcodes.MinigameSendGameMessage]: {
    message: State;
  };
  [ServerOpcodes.MinigameSendPlayerMessage]: {
    user: string;
    message: State;
  };
  [ServerOpcodes.MinigameSendPrivateMessage]: {
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
  | ServerOpcodeAndData<ServerOpcodes.GetInformation>
  | ServerOpcodeAndData<ServerOpcodes.PlayerJoin>
  | ServerOpcodeAndData<ServerOpcodes.PlayerLeft>
  | ServerOpcodeAndData<ServerOpcodes.TransferHost>
  | ServerOpcodeAndData<ServerOpcodes.UpdatedRoomSettings>
  | ServerOpcodeAndData<ServerOpcodes.LoadMinigame>
  | ServerOpcodeAndData<ServerOpcodes.EndMinigame>
  | ServerOpcodeAndData<ServerOpcodes.MinigamePlayerReady>
  | ServerOpcodeAndData<ServerOpcodes.MinigameStartGame>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSetGameState>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSetPlayerState>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendGameMessage>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendPlayerMessage>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendPrivateMessage>;
