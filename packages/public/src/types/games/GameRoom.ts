import type { State } from "../../types";

export interface GameRoomSettings {}

export interface GameRoom extends GameRoomSettings {
  host: string;
  state: State;
}

export interface GameRoomPrivate extends GameRoom {
  id: string;
}
