import type { MinigamePublishType } from "../../types";

export interface Minigame {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  preview_image: {
    url: string;
    placeholder: string;
  } | null;
  publish_type: MinigamePublishType;
  legal: {
    terms: string | null;
    privacy: string | null;
  };
  prompt: string;
  minimum_players_to_start: number;
  created_at: string;
}
