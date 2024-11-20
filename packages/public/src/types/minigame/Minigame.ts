import type { MinigameVisibility } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  previewImage: {
    url: string;
    placeholder: string;
  } | null;
  visibility: MinigameVisibility;
  legal: {
    terms: string | null;
    privacy: string | null;
  };
  prompt: string;
  minimumPlayersToStart: number;
  createdAt: string;
}
