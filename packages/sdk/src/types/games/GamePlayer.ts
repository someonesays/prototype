import type { State } from "../../types";

export interface GamePlayer {
  id: string;
  displayName: string;
  points: number;
  ready: boolean;
  state: State;
}
