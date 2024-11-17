import type { Minigame, PackVisibility } from "../../types";

export interface Pack {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
  };
  iconImage: {
    url: string;
    placeholder: string;
  } | null;
  visibility: PackVisibility;
  reportable: boolean;
  minigames: {
    data: Minigame[];
    offset: number;
    limit: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}
