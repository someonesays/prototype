import { Hono } from "hono";
import { MessageCodes } from "@/public";
import { getMinigame, getMinigamePublic } from "@/db";
import { sendProxiedImage } from "../../utils";

export const minigames = new Hono();

minigames.get("/:id", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigamePublic(id);
  if (!minigame) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  return c.json(minigame);
});

minigames.get("/:id/images/preview", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame?.previewImage) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  return sendProxiedImage(c, minigame.previewImage);
});
