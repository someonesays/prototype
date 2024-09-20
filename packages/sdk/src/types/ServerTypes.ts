import { ServerOpcodes } from "../opcodes";
import type { GamePlayerPrivate, GameRoomPrivate, Minigame } from "../types";

export interface ServerTypes {
  [ServerOpcodes.Ping]: {};
  [ServerOpcodes.GetInformation]: {
    started: boolean;
    user: string;
    room: GameRoomPrivate;
    minigame: Minigame;
    players: GamePlayerPrivate[];
  };
  [ServerOpcodes.NewChatMessage]: {};
  [ServerOpcodes.PlayerJoin]: {};
  [ServerOpcodes.PlayerLeft]: {};
  [ServerOpcodes.TransferHost]: {};
  [ServerOpcodes.UpdatedRoomSettings]: {};
  [ServerOpcodes.UpdatedScreen]: {};
  [ServerOpcodes.UpdatedLeaderboards]: {};
  [ServerOpcodes.MinigamePlayerReady]: {};
  [ServerOpcodes.MinigameStartGame]: {};
  [ServerOpcodes.MinigameSetGameState]: {};
  [ServerOpcodes.MinigameSetPlayerState]: {};
  [ServerOpcodes.MinigameSendGameMessage]: {};
  [ServerOpcodes.MinigameSendPlayerMessage]: {};
}
