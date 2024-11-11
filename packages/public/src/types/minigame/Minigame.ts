import type { MinigameVisibility } from "../../types";

export interface Minigame {
  id: string;
  visibility: MinigameVisibility;
  prompt: string;
  minimumPlayersToStart: number;
  author: {
    name: string;
  };
  url: string;
  createdAt: string;
  updatedAt: string;
}
