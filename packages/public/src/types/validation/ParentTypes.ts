import type { ParentOpcodes, State, MinigamePlayer, GameRoom, GameSettings } from "../../types";

export interface ParentTypes {
  [ParentOpcodes.READY]: {
    settings: GameSettings;
    user: number;
    room: GameRoom;
    players: MinigamePlayer[];
  };
  [ParentOpcodes.UPDATE_SETTINGS]: { settings: Partial<GameSettings> };
  [ParentOpcodes.START_GAME]: { joinedLate: boolean };
  [ParentOpcodes.MINIGAME_PLAYER_READY]: { player: MinigamePlayer; joinedLate: boolean };
  [ParentOpcodes.PLAYER_LEFT]: { user: number };
  [ParentOpcodes.UPDATED_GAME_STATE]: { state: State };
  [ParentOpcodes.UPDATED_PLAYER_STATE]: { user: number; state: State };
  [ParentOpcodes.RECEIVED_GAME_MESSAGE]: { message: State };
  [ParentOpcodes.RECEIVED_PLAYER_MESSAGE]: { user: number; message: State };
  [ParentOpcodes.RECEIVED_PRIVATE_MESSAGE]: { fromUser: number; toUser: number; message: State };
  [ParentOpcodes.RECEIVED_BINARY_GAME_MESSAGE]: Uint8Array;
  [ParentOpcodes.RECEIVED_BINARY_PLAYER_MESSAGE]: { user: number; message: Uint8Array };
  [ParentOpcodes.RECEIVED_BINARY_PRIVATE_MESSAGE]: { fromUser: number; toUser: number; message: Uint8Array };
}
