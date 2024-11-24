import { Hono } from "hono";
import { authMiddleware } from "../../middleware";
import { getUserPublic, transformToUserPublic } from "@/db";
import { MessageCodes } from "@/public";

export const users = new Hono();

users.get("/@me", authMiddleware, async (c) => {
  return c.json({ user: transformToUserPublic(c.var.user) });
});

users.get("/:id", async (c) => {
  const user = await getUserPublic(c.req.param("id"));
  if (!user) return c.json({ code: MessageCodes.NotFound });
  return c.json({ user });
});
