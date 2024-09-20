import { ParentOpcodes } from "../opcodes";
import type { State, GamePlayer, GameRoom, GameSettings, GamePlayerSetState } from "../types";

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
    user: string;
  };
  [ParentOpcodes.UpdatedGameState]: {
    room: GameRoom;
  };
  [ParentOpcodes.UpdatedPlayerState]: {
    player: GamePlayerSetState;
  };
  [ParentOpcodes.ReceivedGameMessage]: {
    message: State;
  };
  [ParentOpcodes.ReceivedPlayerMessage]: {
    user: string;
    message: State;
  };
}
