import { Hono } from "hono";
import { MessageCodes } from "@/public";
import { getMinigame } from "@/db";

export const minigames = new Hono();

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame) return c.json({ code: MessageCodes.NotFound }, 404);

  return c.json({
    id: minigame.id,
    visibility: minigame.visibility,
    prompt: minigame.prompt,
    author: {
      name: minigame.author.name,
    },
    url: `/api/proxy/${minigame.id}/`,
    createdAt: minigame.createdAt,
    updatedAt: minigame.updatedAt,
  });
});
