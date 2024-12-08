import { createCuid } from "@/utils";
import { boolean, text, smallint, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { PackPublishType } from "@/public";
import { NOW } from "../src/utils/utils";

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
  currentlyFeatured: boolean("currently_featured").notNull().default(false),
  randomize: boolean("randomize").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(NOW),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(NOW),
});

export const packsRelations = relations(packs, ({ one }) => ({
  author: one(users, {
    fields: [packs.authorId],
    references: [users.id],
  }),
}));
