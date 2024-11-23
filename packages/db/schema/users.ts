import { createCuid } from "@/utils";
import { text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { minigames } from "./minigames";
import { packs } from "./packs";

export const users = pgTable("users", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createCuid()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),

  discordId: text("discord_id").unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
  minigames: many(minigames),
  packs: many(packs),
}));
