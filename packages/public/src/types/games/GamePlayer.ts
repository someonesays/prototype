import type { State } from "../../types";

export interface MinigamePlayer {
  id: number;
  displayName: string;
  avatar: string;
  mobile: boolean;
  state: State;
}

export interface GamePlayer extends MinigamePlayer {
  ready: boolean;
}
