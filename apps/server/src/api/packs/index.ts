import { Hono } from "hono";
import { MessageCodes, PackPublishType } from "@/public";
import { getPackPublic } from "@/db";

export const packs = new Hono();

packs.get("/:id", async (c) => {
  const id = c.req.param("id");

  const pack = await getPackPublic({ id });
  if (!pack || pack.publishType === PackPublishType.DISABLED) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  return c.json(pack);
});
