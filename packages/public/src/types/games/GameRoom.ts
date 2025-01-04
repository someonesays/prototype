import type { State } from "../../types";

export interface GameRoomSettings {}

export interface GameRoom extends GameRoomSettings {
  host: number;
  state: State;
}

export interface GameRoomPrivate extends GameRoom {
  id: string;
}
