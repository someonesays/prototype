import type { MinigamePublishType } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  publishType: MinigamePublishType;
  author: {
    id: string;
    name: string;
    createdAt: string;
  };
  previewImage: {
    url: string;
    placeholder: string;
  } | null;
  opts: {
    prompt: string;
    minimumPlayersToStart: number;
  };
  legal: {
    terms: string | null;
    privacy: string | null;
  };
  createdAt: string;
}
