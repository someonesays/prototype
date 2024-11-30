import { getMinigame, getPack } from "@/db";
import { ErrorMessageCodes } from "@/public";
import { Hono } from "hono";
import { sendProxiedImage } from "../utils";

export const images = new Hono();

images.get("/minigames/:id/preview", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame?.previewImage) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return sendProxiedImage(c, minigame.previewImage);
});

images.get("/:id/packs/icon", async (c) => {
  const id = c.req.param("id");

  const pack = await getPack(id);
  if (!pack?.iconImage) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return sendProxiedImage(c, pack.iconImage);
});
