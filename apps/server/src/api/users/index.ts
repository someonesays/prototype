import { Hono } from "hono";
import { authMiddleware } from "../../middleware";
import { getUserPublic, resetUserLastRevokedToken } from "@/db";
import { ErrorMessageCodes } from "@/public";

import { userMinigames } from "./minigames";
import { userPacks } from "./packs";

export const users = new Hono();

users.route("/@me/minigames", userMinigames);
users.route("/@me/packs", userPacks);

users.delete("/@me/sessions", authMiddleware, async (c) => {
  await resetUserLastRevokedToken(c.var.user.id);
  return c.json({ success: true });
});

users.get("/@me", authMiddleware, async (c) => {
  return c.json({ user: c.var.user });
});

users.get("/:id", async (c) => {
  const user = await getUserPublic(c.req.param("id"));
  if (!user) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);
  return c.json({ user });
});
