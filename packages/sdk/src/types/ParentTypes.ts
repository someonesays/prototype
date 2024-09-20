import { ParentOpcodes } from "../opcodes";
import type { State, GamePlayer, GameRoom, GameSettings } from "../types";

export interface ParentTypes {
  [ParentOpcodes.Ready]: {
    started: boolean;
    settings: GameSettings;
    user: string;
    room: GameRoom;
    players: GamePlayer[];
  };
  [ParentOpcodes.UpdateSettings]: {
    settings: GameSettings;
  };
  [ParentOpcodes.StartGame]: {
    started: true;
  };
  [ParentOpcodes.PlayerReady]: {
    player: GamePlayer;
  };
  [ParentOpcodes.PlayerLeft]: {
    player: GamePlayer;
  };
  [ParentOpcodes.UpdatedGameState]: {
    room: GameRoom;
  };
  [ParentOpcodes.UpdatedPlayerState]: {
    player: GamePlayer;
  };
  [ParentOpcodes.ReceivedGameMessage]: {
    message: State;
  };
  [ParentOpcodes.ReceivedPlayerMessage]: {
    player: GamePlayer;
    message: State;
  };
}
