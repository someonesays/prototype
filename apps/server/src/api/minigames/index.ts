import { Hono } from "hono";
import { ErrorMessageCodes, MinigamePublishType } from "@/public";
import { getMinigamePublic, getMinigamesPublic } from "@/db";
import { getOffsetAndLimit } from "../../utils";

export const minigames = new Hono();

minigames.get("/", async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  const query = c.req.query("query");
  const include = c.req
    .query("include")
    ?.toLowerCase()
    .trim()
    .split(",")
    .filter((i) => ["official", "unofficial", "featured"].includes(i)) as ["official", "unofficial", "featured"];

  const minigames = await getMinigamesPublic({ publicOnly: true, query, include, offset, limit });
  return c.json(minigames);
});

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigamePublic(id);
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ minigame });
});
