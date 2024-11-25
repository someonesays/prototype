import { createCuid } from "@/utils";
import { text, smallint, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { PackPublishType } from "@/public";

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
  publishType: smallint("publish_type").$type<PackPublishType>().notNull().default(PackPublishType.UNLISTED),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const packsRelations = relations(packs, ({ one }) => ({
  author: one(users, {
    fields: [packs.authorId],
    references: [users.id],
  }),
}));
