import type { Minigame, PackPublishType } from "../../types";

export interface Pack {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    createdAt: string;
  };
  iconImage: {
    url: string;
    placeholder: string;
  } | null;
  publishType: PackPublishType;
  minigames: {
    data: Minigame[];
    offset: number;
    limit: number;
    total: number;
  };
  createdAt: string;
}
