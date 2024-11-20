import { createCuid } from "@/utils";
import { text, smallint, date, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { PackVisibility } from "@/public";

import { users } from "./users";

export const packs = pgTable("packs", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createCuid()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  iconImage: text("icon_image"),
  iconPlaceholderImage: text("icon_placeholder_image"),
  visibility: smallint("visibility").$type<PackVisibility>().notNull(),
  createdAt: date("created_at").defaultNow().notNull(),
});

export const packsRelations = relations(packs, ({ one }) => ({
  author: one(users, {
    fields: [packs.authorId],
    references: [users.id],
  }),
}));
