import type { State } from "../types";

export interface GamePlayer {
  id: string;
  displayName: string;
  ready: boolean;
  state: State;
}

export interface GamePlayerPrivate extends GamePlayer {
  points: number;
}

export interface GamePlayerLeaderboards extends Omit<GamePlayerPrivate, "displayName" | "state"> {
  ready: false;
}
