import { Hono } from "hono";
import { MessageCodes, MinigameVisibility } from "@/public";
import { getMinigamePublic } from "@/db";

export const minigames = new Hono();

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigamePublic(id);
  if (!minigame || minigame.visibility === MinigameVisibility.Disabled) return c.json({ code: MessageCodes.NotFound }, 404);

  return c.json(minigame);
});
