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
  [ServerOpcodes.Error]: {
    message: string;
  };
  [ServerOpcodes.GetInformation]: {
    status: GameStatus;
    user: string; // (user = player id)
    room: GameRoomPrivate;
    pack: Pack | null;
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
    pack: Pack | null;
    minigame: Minigame | null;
  };
  [ServerOpcodes.LoadMinigame]: {
    players: GamePlayer[];
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
  [ServerOpcodes.MinigameSendPrivateMessage]: {
    from_user: string; // User who sent it
    to_user: string; // Who it was sent by (mainly for the host)
    message: State;
  };
}

export interface ServerOpcodeAndData<O extends ServerOpcodes> {
  opcode: O;
  data: ServerTypes[O];
}

export type ServerOpcodeAndDatas =
  | ServerOpcodeAndData<ServerOpcodes.Error>
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
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendPrivateMessage>;
