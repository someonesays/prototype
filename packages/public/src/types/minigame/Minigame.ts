import type { MinigameVisibility } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
  };
  previewImage: {
    url: string;
    placeholder: string;
  } | null;
  visibility: MinigameVisibility;
  prompt: string;
  minimumPlayersToStart: number;
  reportable: boolean;
  url: string;
  createdAt: string;
  updatedAt: string;
}
