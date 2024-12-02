import { boolean, varchar, text, integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { NOW } from "../src/utils/utils";
import { MatchmakingLocation } from "@/public";

export const servers = pgTable("servers", {
  id: varchar("id", { length: 3 }).primaryKey(),
  location: text("location").$type<MatchmakingLocation>().notNull(),
  disabled: boolean("disabled").notNull().default(false),
  url: text("url").notNull(), // Do not add the trailing "/"
  ws: text("ws"),
  wsTesting: text("ws_testing"),
  wsDiscord: text("ws_discord"),
  currentRooms: integer("current_rooms").notNull().default(0),
  maxRooms: integer("max_rooms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(NOW),
});
