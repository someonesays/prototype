import type { Minigame, PackPublishType } from "../../types";

export interface Pack {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  icon_image: {
    url: string;
    placeholder: string;
  } | null;
  publish_type: PackPublishType;
  minigames: {
    data: Minigame[];
    offset: number;
    limit: number;
    total: number;
  };
  created_at: string;
}
