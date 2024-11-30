import { Hono } from "hono";
import { ErrorMessageCodes } from "@/public";
import { getMinigamePublic } from "@/db";

export const minigames = new Hono();

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigamePublic(id);
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ minigame });
});
