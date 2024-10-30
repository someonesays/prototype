import { ServerOpcodes } from "../opcodes";
import type {
  GamePlayerLeaderboards,
  GamePlayerPrivate,
  GameRoomPrivate,
  GameRoomSettings,
  Minigame,
  Screens,
  State,
} from "../types";

export interface ServerTypes {
  [ServerOpcodes.GetInformation]: {
    started: boolean;
    user: string;
    room: GameRoomPrivate;
    screen: Screens;
    minigame: Minigame | null;
    players: GamePlayerPrivate[];
  };
  [ServerOpcodes.PlayerJoin]: {
    player: GamePlayerPrivate;
  };
  [ServerOpcodes.PlayerLeft]: {
    user: string;
  };
  [ServerOpcodes.TransferHost]: {
    user: string;
  };
  [ServerOpcodes.UpdatedRoomSettings]: {
    room: GameRoomSettings;
  };
  [ServerOpcodes.UpdatedScreen]: {
    screen: Screens;
    players: GamePlayerLeaderboards[];
    minigame?: Minigame;
    hostLeftRoom?: boolean;
  };
  [ServerOpcodes.PlayerReady]: {
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
    user: string; // User who sent it
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
  | ServerOpcodeAndData<ServerOpcodes.UpdatedScreen>
  | ServerOpcodeAndData<ServerOpcodes.PlayerReady>
  | ServerOpcodeAndData<ServerOpcodes.MinigameStartGame>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSetGameState>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSetPlayerState>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendGameMessage>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendPlayerMessage>
  | ServerOpcodeAndData<ServerOpcodes.MinigameSendPrivateMessage>;
