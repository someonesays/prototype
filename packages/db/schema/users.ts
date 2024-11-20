import { createCuid } from "@/utils";
import { text, date, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { minigames } from "./minigames";
import { packs } from "./packs";

export const users = pgTable("users", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createCuid()),
  name: text("name").notNull(),
  createdAt: date("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  minigames: many(minigames),
  packs: many(packs),
}));
