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
  previewImage: string | null;
  prompt: string;
  minimumPlayersToStart: number;
  privacyPolicy: string | null;
  termsOfServices: string | null;
  createdAt: string;
}
