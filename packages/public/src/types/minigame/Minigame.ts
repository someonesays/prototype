import type { MinigameVisibility } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  previewImage: {
    url: string;
    placeholder: string;
  } | null;
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
