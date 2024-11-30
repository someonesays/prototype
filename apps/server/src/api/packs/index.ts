import { Hono } from "hono";
import { ErrorMessageCodes } from "@/public";
import { getPack, getPackMinigamesPublic, getPackPublic } from "@/db";
import { sendProxiedImage, getOffsetAndLimit } from "../../utils";

export const packs = new Hono();

packs.get("/:id", async (c) => {
  const id = c.req.param("id");

  const pack = await getPackPublic(id);
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ pack });
});

packs.get("/:id/minigames", async (c) => {
  const id = c.req.param("id");
  const { offset, limit } = getOffsetAndLimit(c);

  const pack = await getPackPublic(id);
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  const minigames = await getPackMinigamesPublic({ id, offset, limit });
  return c.json(minigames);
});
