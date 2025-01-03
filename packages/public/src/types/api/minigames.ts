import type { Minigame } from "../../types";

export interface ApiGetMinigame {
  minigame: Minigame;
}

export interface ApiGetMinigames {
  offset: number;
  limit: number;
  total: number;
  minigames: Minigame[];
}
