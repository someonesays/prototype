import type { ParentOpcodes, State, MinigamePlayer, GameRoom, GameSettings } from "../../types";

export interface ParentTypes {
  [ParentOpcodes.Ready]: {
    settings: GameSettings;
    user: string;
    room: GameRoom;
    players: MinigamePlayer[];
  };
  [ParentOpcodes.UpdateSettings]: {
    settings: GameSettings;
  };
  [ParentOpcodes.StartGame]: {
    joined_late: boolean;
  };
  [ParentOpcodes.MinigamePlayerReady]: {
    player: MinigamePlayer;
    joined_late: boolean;
  };
  [ParentOpcodes.PlayerLeft]: {
    user: string;
  };
  [ParentOpcodes.UpdatedGameState]: {
    state: State;
  };
  [ParentOpcodes.UpdatedPlayerState]: {
    user: string;
    state: State;
  };
  [ParentOpcodes.ReceivedGameMessage]: {
    message: State;
  };
  [ParentOpcodes.ReceivedPlayerMessage]: {
    user: string;
    message: State;
  };
  [ParentOpcodes.ReceivedPrivateMessage]: {
    from_user: string;
    to_user: string;
    message: State;
  };
}
