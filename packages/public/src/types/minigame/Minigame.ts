import type { MinigamePublishType } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    createdAt: string;
  };
  previewImage: {
    url: string;
    placeholder: string;
  } | null;
  publishType: MinigamePublishType;
  legal: {
    terms: string | null;
    privacy: string | null;
  };
  prompt: string;
  minimumPlayersToStart: number;
  createdAt: string;
}
