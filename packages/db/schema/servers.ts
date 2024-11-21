import { varchar, text, integer, pgTable } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
  id: varchar("id", { length: 3 }).primaryKey(),
  url: text("url").notNull(), // Do not add the trailing "/"
  ws: text("ws").notNull(),
  wsDiscord: text("ws_discord").notNull(),
  currentRooms: integer("current_rooms").notNull().default(0),
  maxRooms: integer("max_rooms").notNull(),
});
