import { createCuid } from "@/utils";
import { MinigamePathType, MinigameVisibility } from "@/public";
import { text, smallint, pgTable, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./users";

export const minigames = pgTable("minigames", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => createCuid()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  previewImage: text("preview_image"),
  previewPlaceholderImage: text("preview_placeholder_image"), // data:// URL (ThumbHash)
  visibility: smallint("visibility").$type<MinigameVisibility>().notNull(),
  prompt: text("prompt").notNull(),
  legalTermsUrl: text("legal_terms_url").notNull(),
  legalPrivacyUrl: text("legal_privacy_url").notNull(),
  proxyUrl: text("proxy_url"),
  pathType: smallint("path_type").$type<MinigamePathType>().notNull(),
  minimumPlayersToStart: smallint("minimum_players_to_start").notNull().default(1),
  createdAt: date("created_at").defaultNow().notNull(),
});

export const minigamesRelations = relations(minigames, ({ one }) => ({
  author: one(users, {
    fields: [minigames.authorId],
    references: [users.id],
  }),
}));
