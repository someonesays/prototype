import type { Minigame, Pack } from "../../types";

export interface ApiGetPack {
  pack: Pack;
}

export interface ApiGetPackMinigames {
  offset: number;
  limit: number;
  total: number;
  minigames: Minigame[];
}
