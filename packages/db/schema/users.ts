import { createCuid } from "@/utils";
import { boolean, text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { NOW } from "../src/utils/utils";

import { minigames } from "./minigames";

export const users = pgTable("users", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createCuid()),
  name: text("name").notNull(),
  discordId: text("discord_id").unique(),
  admin: boolean("admin").notNull().default(false),
  lastRevokedToken: timestamp("last_revoked_tokens", { withTimezone: true }).notNull().default(NOW),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(NOW),
});

export const usersRelations = relations(users, ({ many }) => ({
  minigames: many(minigames),
}));
