import type { Visibility } from "@/public";

export interface Minigame {
  id: string;
  visibility: Visibility;
  prompt: string;
  minimumPlayersToStart: number;
  author: {
    name: string;
  };
  url: string;
  createdAt: string;
  updatedAt: string;
}

export enum MinigameEndReason {
  MinigameEnded = 0,
  ForcefulEnd = 1,
  HostLeft = 2,
  FailedToSatisfyMinimumPlayersToStart = 4,
}
