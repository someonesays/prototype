import { createCode, createCuid } from "@/utils";
import { MatchmakingLocation, MinigameOrientation, MinigamePathType, MinigamePublishType } from "@/public";
import { boolean, text, smallint, pgTable, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { NOW } from "../src/utils/utils";

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
  publishType: smallint("publish_type").$type<MinigamePublishType>().notNull().default(MinigamePublishType.UNLISTED),

  termsOfServices: text("terms_of_services"),
  privacyPolicy: text("privacy_policy"),

  proxyUrl: text("proxy_url"),
  pathType: smallint("path_type").$type<MinigamePathType>().notNull().default(MinigamePathType.WHOLE_PATH),

  testingLocation: text("testing_location").$type<MatchmakingLocation>().notNull().default(MatchmakingLocation.USA),
  testingAccessCode: text("testing_access_code")
    .notNull()
    .$defaultFn(() => createCode(18)),

  minimumPlayersToStart: smallint("minimum_players_to_start").notNull().default(1),

  supportsMobile: boolean("supports_mobile").notNull().default(false),
  mobileOrientation: smallint("mobile_orientation").$type<MinigameOrientation>().notNull().default(MinigameOrientation.NONE),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(NOW),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(NOW),
});

export const minigamesRelations = relations(minigames, ({ one }) => ({
  author: one(users, {
    fields: [minigames.authorId],
    references: [users.id],
  }),
}));
