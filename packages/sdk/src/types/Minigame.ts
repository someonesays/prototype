import type { Visibility } from "@/public";

export interface Minigame {
  id: string;
  visibility: Visibility;
  prompt: string;
  author: {
    name: string;
  };
  url: string;
  createdAt: string;
  updatedAt: string;
}
