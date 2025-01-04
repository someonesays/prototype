import { Hono } from "hono";
import { ErrorMessageCodes } from "@/public";
import { getMinigamePublic, getMinigamesPublic } from "@/db";
import { getOffsetAndLimit } from "../../utils";

export const minigames = new Hono();

minigames.get("/", async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  const query = c.req.query("query");
  const featured = c.req.query("featured")?.toLowerCase() === "true";

  const minigames = await getMinigamesPublic({ publicOnly: true, query, currentlyFeatured: featured, offset, limit });
  return c.json(minigames);
});

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigamePublic(id);
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ minigame });
});
