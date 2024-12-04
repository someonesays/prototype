import type { schema } from "@/db";
import type { Minigame, User } from "../../types";

export interface ApiGetUserMe {
  user: typeof schema.users.$inferSelect;
}

export interface ApiGetUser {
  user: User;
}

export interface ApiGetUserMinigames {
  offset: number;
  limit: number;
  total: number;
  minigames: (typeof schema.minigames.$inferSelect)[];
}

export interface ApiGetUserMinigame {
  minigame: typeof schema.minigames.$inferSelect;
}

export interface ApiPostUserMinigame {
  id: string;
}

export interface ApiGetUserPacks {
  offset: number;
  limit: number;
  total: number;
  packs: (typeof schema.packs.$inferSelect)[];
}

export interface ApiGetUserPack {
  pack: typeof schema.packs.$inferSelect;
}

export interface ApiGetUserPackMinigames {
  offset: number;
  limit: number;
  total: number;
  minigames: Minigame[];
}

export interface ApiPostUserPack {
  id: string;
}
