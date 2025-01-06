import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getMinigame } from "@/db";
import { ErrorMessageCodes } from "@/public";
import { sendProxiedImage } from "../utils";

export const images = new Hono();

images.use(
  "/avatars/*",
  serveStatic({
    rewriteRequestPath: (path) => path.replace(/^\/api\/images\/avatars/, "/static/avatars"),
  }),
);

images.get("/minigames/:id/icon", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame?.iconImage) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return sendProxiedImage(c, minigame.iconImage);
});

images.get("/minigames/:id/preview", async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame?.previewImage) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return sendProxiedImage(c, minigame.previewImage);
});
