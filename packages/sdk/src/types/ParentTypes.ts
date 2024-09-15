import { ParentOpcodes } from "../opcodes";
import type { State, GamePlayer, GameRoom } from "../types";

export interface ParentTypes {
  [ParentOpcodes.Ready]: {
    started: boolean;
    user: string;
    room: GameRoom;
    players: GamePlayer[];
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
