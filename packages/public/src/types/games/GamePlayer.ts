import type { State } from "../../types";

export interface MinigamePlayer {
  id: string;
  displayName: string;
  state: State;
}

export interface GamePlayer extends MinigamePlayer {
  points: number;
  ready: boolean;
}
