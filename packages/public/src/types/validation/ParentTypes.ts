import type { ParentOpcodes, State, MinigamePlayer, GameRoom, GameSettings } from "../../types";

export interface ParentTypes {
  [ParentOpcodes.READY]: {
    settings: GameSettings;
    user: string;
    room: GameRoom;
    players: MinigamePlayer[];
  };
  [ParentOpcodes.UPDATE_SETTINGS]: {
    settings: Partial<GameSettings>;
  };
  [ParentOpcodes.START_GAME]: {
    joinedLate: boolean;
  };
  [ParentOpcodes.MINIGAME_PLAYER_READY]: {
    player: MinigamePlayer;
    joinedLate: boolean;
  };
  [ParentOpcodes.PLAYER_LEFT]: {
    user: string;
  };
  [ParentOpcodes.UPDATED_GAME_STATE]: {
    state: State;
  };
  [ParentOpcodes.UPDATED_PLAYER_STATE]: {
    user: string;
    state: State;
  };
  [ParentOpcodes.RECEIVED_GAME_MESSAGE]: {
    message: State;
  };
  [ParentOpcodes.RECEIVED_PLAYER_MESSAGE]: {
    user: string;
    message: State;
  };
  [ParentOpcodes.RECEIVED_PRIVATE_MESSAGE]: {
    fromUser: string;
    toUser: string;
    message: State;
  };
}
