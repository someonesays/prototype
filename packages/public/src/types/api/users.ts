import type { schema } from "@/db";
import type { User } from "../../types";

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
