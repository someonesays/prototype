import { text, pgTable, primaryKey } from "drizzle-orm/pg-core";

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
  },
  (table) => [
    primaryKey({
      columns: [table.packId, table.minigameId],
    }),
  ],
);
