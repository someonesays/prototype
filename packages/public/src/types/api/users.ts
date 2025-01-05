import type { schema } from "@/db";
import type { User } from "../../types";

export interface ApiGetUserMe {
  user: typeof schema.users.$inferSelect;
}

export interface ApiGetUser {
  user: User;
}

export type PrivateMinigame = typeof schema.minigames.$inferSelect;

export interface ApiGetUserMinigames {
  offset: number;
  limit: number;
  total: number;
  minigames: PrivateMinigame[];
}

export interface ApiGetUserMinigame {
  minigame: PrivateMinigame;
}

export interface ApiPostUserMinigame {
  id: string;
}
