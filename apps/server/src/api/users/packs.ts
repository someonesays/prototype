import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ErrorMessageCodes } from "@/public";
import { authMiddleware } from "../../middleware";
import {
  addMinigameToPack,
  createPack,
  deletePackWithAuthorId,
  getMinigameInPack,
  getMinigamePublic,
  getPackByAuthorId,
  getPackMinigamesPublic,
  getPacksByAuthorId,
  removeMinigameFromPack,
  updatePackWithAuthorId,
} from "@/db";
import { validateImageUrl, getOffsetAndLimit } from "../../utils";
import { validateUrl } from "@/utils";

export const userPacks = new Hono();

const userPackZod = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(0).max(4000).default(""),
  iconImage: z.string().refine(validateUrl).nullable().default(null),
});

userPacks.get("/", authMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  return c.json(await getPacksByAuthorId({ authorId: c.var.user.id, offset, limit }));
});

userPacks.post("/", authMiddleware, zValidator("json", userPackZod), async (c) => {
  const values = c.req.valid("json");

  if (values.iconImage) {
    const canAccessPage = await validateImageUrl(values.iconImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  const id = await createPack({ authorId: c.var.user.id, ...values });
  return c.json({ id });
});

userPacks.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ pack });
});

userPacks.patch("/:id", authMiddleware, zValidator("json", userPackZod), async (c) => {
  const id = c.req.param("id");
  const values = c.req.valid("json");

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  if (values.iconImage) {
    const canAccessPage = await validateImageUrl(values.iconImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  await updatePackWithAuthorId({ id, authorId: c.var.user.id, ...values });
  return c.json({ success: true });
});

userPacks.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  await deletePackWithAuthorId({ id, authorId: c.var.user.id });

  return c.json({ success: true });
});

userPacks.get("/:id/minigames", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const { offset, limit } = getOffsetAndLimit(c);

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  const minigames = await getPackMinigamesPublic({ id: pack.id, offset, limit });
  return c.json(minigames);
});

userPacks.post("/:id/minigames/:minigameId", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const minigameId = c.req.param("minigameId");

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  const minigame = await getMinigamePublic(minigameId);
  if (!minigame) return c.json({ code: ErrorMessageCodes.CANNOT_FIND_MINIGAME_FOR_PACK }, 404);

  const alreadyInPack = await getMinigameInPack({ packId: pack.id, minigameId: minigame.id });
  if (alreadyInPack) return c.json({ code: ErrorMessageCodes.MINIGAME_ALREADY_IN_PACK }, 409);

  try {
    await addMinigameToPack({ packId: pack.id, minigameId });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ code: ErrorMessageCodes.INTERNAL_ERROR }, 500);
  }
});

userPacks.delete("/:id/minigames/:minigameId", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const minigameId = c.req.param("minigameId");

  const pack = await getPackByAuthorId({ id, authorId: c.var.user.id });
  if (!pack) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  await removeMinigameFromPack({ packId: pack.id, minigameId });
  return c.json({ success: true });
});
