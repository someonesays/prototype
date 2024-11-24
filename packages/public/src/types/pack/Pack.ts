import type { Minigame, PackPublishType } from "../../types";

export interface Pack {
  id: string;
  name: string;
  description: string;
  publishType: PackPublishType;
  author: {
    id: string;
    name: string;
    createdAt: string;
  };
  iconImage: string | null;
  minigames: {
    data: Minigame[];
    offset: number;
    limit: number;
    total: number;
  };
  createdAt: string;
}
