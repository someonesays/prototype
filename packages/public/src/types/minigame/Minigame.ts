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
    normal: string;
    discord: string;
  } | null;
  proxies: {
    normal: string;
    discord: string;
  };
  prompt: string;
  minimumPlayersToStart: number;
  privacyPolicy: string | null;
  termsOfServices: string | null;
  createdAt: string;
}
