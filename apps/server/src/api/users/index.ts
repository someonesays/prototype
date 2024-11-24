import { Hono } from "hono";
import { authMiddleware } from "../../middleware";
import { getUserPublic, transformUserToUserPublic } from "@/db";
import { MessageCodes } from "@/public";

export const users = new Hono();

users.get("/@me", authMiddleware, async (c) => {
  return c.json({ user: transformUserToUserPublic(c.var.user) });
});

users.get("/:id", async (c) => {
  const user = await getUserPublic(c.req.param("id"));
  if (!user) return c.json({ code: MessageCodes.NOT_FOUND });
  return c.json({ user });
});
