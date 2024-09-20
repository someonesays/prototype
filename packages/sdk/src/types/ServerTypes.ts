import { ServerOpcodes } from "../opcodes";
import type {
  GamePlayerLeaderboards,
  GamePlayerPrivate,
  GamePlayerSetState,
  GameRoomPrivate,
  Minigame,
  Screens,
  State,
} from "../types";

export interface ServerTypes {
  // biome-ignore lint/complexity/noBannedTypes: Doesn't need to send anything over
  [ServerOpcodes.Ping]: {};
  [ServerOpcodes.GetInformation]: {
    started: boolean;
    user: string;
    room: GameRoomPrivate;
    screen: Screens;
    minigame: Minigame;
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
    room: GameRoomPrivate;
  };
  [ServerOpcodes.UpdatedScreen]: {
    screen: Screens;
    players?: GamePlayerLeaderboards[];
    minigame?: Minigame;
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
    player: GamePlayerSetState;
  };
  [ServerOpcodes.MinigameSendGameMessage]: {
    message: State;
  };
  [ServerOpcodes.MinigameSendPlayerMessage]: {
    user: string;
    message: State;
  };
}
