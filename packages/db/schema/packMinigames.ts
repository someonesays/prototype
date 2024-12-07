import { relations } from "drizzle-orm";
import { text, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { NOW } from "../src/utils/utils";

import { packs } from "./packs";
import { minigames } from "./minigames";

export const packsMinigames = pgTable(
  "packs_minigames",
  {
    packId: text("pack_id")
      .notNull()
      .references(() => packs.id, { onDelete: "cascade" }),
    minigameId: text("minigame_id")
      .notNull()
      .references(() => minigames.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(NOW),
  },
  (table) => [
    primaryKey({
      columns: [table.packId, table.minigameId],
    }),
  ],
);

export const packMinigamesRelations = relations(packsMinigames, ({ one }) => ({
  minigame: one(minigames, {
    fields: [packsMinigames.minigameId],
    references: [minigames.id],
  }),
}));
