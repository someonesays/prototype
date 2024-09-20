import { Hono } from "hono";
import { MessageCodes } from "@/public";
import { getMinigamePublic } from "@/db";

export const minigames = new Hono();

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = getMinigamePublic(id);
  if (!minigame) return c.json({ code: MessageCodes.NotFound }, 404);

  return c.json(minigame);
});
