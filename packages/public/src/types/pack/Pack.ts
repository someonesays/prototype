import type { PackPublishType } from "../../types";

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
  iconImage: {
    normal: string;
    discord: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
