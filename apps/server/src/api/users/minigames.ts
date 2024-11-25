import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { MessageCodes, MinigamePathType } from "@/public";
import {
  createMinigame,
  deleteMinigameWithAuthorId,
  getMinigameByAuthorId,
  getMinigamesByAuthorId,
  updateMinigameWithAuthorId,
} from "@/db";
import { validateUrl } from "@/utils";
import { authMiddleware } from "../../middleware";
import { getOffsetAndLimit, validateImageUrl } from "../../utils";

export const userMinigames = new Hono();

const userMinigameZod = z.object({
  name: z.string().min(1).max(32),
  description: z.string().min(0).max(32).default(""),
  previewImage: z.string().refine(validateUrl).nullable().default(null),
  prompt: z.string().min(1).max(500),
  termsOfServices: z.string().refine(validateUrl).nullable().default(null),
  privacyPolicy: z.string().refine(validateUrl).nullable().default(null),
  proxyUrl: z.string().refine(validateUrl).nullable().default(null),
  pathType: z.nativeEnum(MinigamePathType).default(MinigamePathType.WHOLE_PATH),
  minimumPlayersToStart: z.number().int().min(1).max(25).default(1),
});

userMinigames.get("/", authMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  return c.json(await getMinigamesByAuthorId({ authorId: c.var.user.id, offset, limit }));
});

userMinigames.post("/", authMiddleware, zValidator("json", userMinigameZod), async (c) => {
  const values = c.req.valid("json");

  if (values.previewImage) {
    const canAccessPage = await validateImageUrl(values.previewImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  const id = await createMinigame({ authorId: c.var.user.id, ...values });
  return c.json({ id });
});

userMinigames.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  return c.json({ minigame });
});

userMinigames.patch("/:id", authMiddleware, zValidator("json", userMinigameZod), async (c) => {
  const id = c.req.param("id");
  const values = c.req.valid("json");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  if (values.previewImage) {
    const canAccessPage = await validateImageUrl(values.previewImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  await updateMinigameWithAuthorId({ id, authorId: c.var.user.id, ...values });
  return c.json({});
});

userMinigames.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: MessageCodes.NOT_FOUND }, 404);

  await deleteMinigameWithAuthorId({ id, authorId: c.var.user.id });
  return c.json({});
});
