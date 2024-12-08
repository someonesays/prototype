import { Hono } from "hono";
import { ErrorMessageCodes } from "@/public";
import { getPackMinigamesPublic, getPackPublic, getPacksPublic } from "@/db";
import { getOffsetAndLimit } from "../../utils";

export const packs = new Hono();

packs.get("/", async (c) => {
  const featured = c.req.query("featured")?.toLowerCase() === "true";

  const packs = await getPacksPublic({ isPublic: true, featured });
  return c.json(packs);
});

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
