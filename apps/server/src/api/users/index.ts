import z from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware";
import { getUserPublic, resetUserLastRevokedToken, updateUser } from "@/db";
import { ErrorMessageCodes } from "@/public";

import { userMinigames } from "./minigames";
import { userPacks } from "./packs";

export const users = new Hono();

users.route("/@me/minigames", userMinigames);
users.route("/@me/packs", userPacks);

users.get("/@me", authMiddleware, async (c) => {
  return c.json({ user: c.var.user });
});

users.patch("/@me", authMiddleware, zValidator("json", z.object({ name: z.string().min(1).max(32) })), async (c) => {
  const { name } = c.req.valid("json");
  await updateUser({ id: c.var.user.id, name });
  return c.json({ success: true });
});

users.delete("/@me/sessions", authMiddleware, async (c) => {
  await resetUserLastRevokedToken(c.var.user.id);
  return c.json({ success: true });
});

users.get("/:id", async (c) => {
  const user = await getUserPublic(c.req.param("id"));
  if (!user) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);
  return c.json({ user });
});
