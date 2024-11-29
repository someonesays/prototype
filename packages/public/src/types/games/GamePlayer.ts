import type { State } from "../../types";

export interface MinigamePlayer {
  id: string;
  displayName: string;
  avatar: string;
  mobile: boolean;
  state: State;
}

export interface GamePlayer extends MinigamePlayer {
  points: number;
  ready: boolean;
}
