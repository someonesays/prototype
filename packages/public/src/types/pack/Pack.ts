import type { Minigame, PackVisibility } from "../../types";

export interface Pack {
  id: string;
  visibility: PackVisibility;
  author: {
    name: string;
  };
  minigames: {
    data: Minigame[];
    offset: number;
    limit: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}
