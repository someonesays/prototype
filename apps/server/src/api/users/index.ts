import { Hono } from "hono";
import { authMiddleware } from "../../middleware";
import { getUserPublic } from "@/db";
import { MessageCodes } from "@/public";

import { userMinigames } from "./minigames";
import { userPacks } from "./packs";

export const users = new Hono();

users.route("/@me/minigames", userMinigames);
users.route("/@me/packs", userPacks);

users.get("/@me", authMiddleware, async (c) => {
  return c.json({ user: c.var.user });
});

users.get("/:id", async (c) => {
  const user = await getUserPublic(c.req.param("id"));
  if (!user) return c.json({ code: MessageCodes.NOT_FOUND });
  return c.json({ user });
});
