import type { State } from "../types";

export interface GameRoom {
  name: string;
  host: string;
  state: State;
}

export interface GameRoomPrivate extends GameRoom {
  id: string;
}
