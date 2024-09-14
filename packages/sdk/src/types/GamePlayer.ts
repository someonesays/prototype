import type { State } from "../types";

export interface GamePlayer {
  id: string;
  displayName: string;
  state: State;
}
