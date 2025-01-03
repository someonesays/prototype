import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ErrorMessageCodes, MatchmakingLocation, MinigameOrientation, MinigamePathType } from "@/public";
import {
  createMinigame,
  deleteMinigameWithAuthorId,
  findBestTestingServerByHashAndLocation,
  getMinigameByAuthorId,
  getMinigames,
  getMinigamesCount,
  updateMinigameWithAuthorId,
} from "@/db";
import { createCode, resetRoom, validateUrl } from "@/utils";
import { authMiddleware } from "../../middleware";
import { getOffsetAndLimit, minigameAccessCodeResetLimit, minigameCreationLimit, validateImageUrl } from "../../utils";

export const userMinigames = new Hono();

const userMinigameZod = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(0).max(4000).default(""),
  previewImage: z.string().refine(validateUrl).nullable().default(null),
  termsOfServices: z.string().refine(validateUrl).nullable().default(null),
  privacyPolicy: z.string().refine(validateUrl).nullable().default(null),
  proxyUrl: z.string().refine(validateUrl).nullable().default(null),
  pathType: z.nativeEnum(MinigamePathType).default(MinigamePathType.WHOLE_PATH),
  minimumPlayersToStart: z.number().int().min(1).max(25).default(1),
  supportsMobile: z.boolean().default(false),
  mobileOrientation: z.nativeEnum(MinigameOrientation).default(MinigameOrientation.NONE),
});

userMinigames.get("/", authMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  return c.json(await getMinigames({ authorId: c.var.user.id, offset, limit }));
});

userMinigames.post("/", authMiddleware, zValidator("json", userMinigameZod), async (c) => {
  const values = c.req.valid("json");

  if (values.previewImage) {
    const canAccessPage = await validateImageUrl(values.previewImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  const success = await minigameCreationLimit.check(c.var.user.id);
  if (!success) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

  const count = await getMinigamesCount({ authorId: c.var.user.id });
  if (count >= 1000) return c.json({ code: ErrorMessageCodes.REACHED_MINIGAME_LIMIT }, 429);

  const id = await createMinigame({ authorId: c.var.user.id, ...values });
  return c.json({ id });
});

userMinigames.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json({ minigame });
});

userMinigames.post(
  "/:id/reset",
  authMiddleware,
  zValidator(
    "json",
    z.object({
      location: z.nativeEnum(MatchmakingLocation),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const values = c.req.valid("json");

    const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
    if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

    const success = await minigameAccessCodeResetLimit.check(minigame.id);
    if (!success) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

    const bestServer = await findBestTestingServerByHashAndLocation({ id: minigame.id, location: minigame.testingLocation });

    const testingAccessCode = createCode(18);
    await updateMinigameWithAuthorId({
      id: minigame.id,
      authorId: c.var.user.id,
      testingLocation: values.location,
      testingAccessCode,
    });

    if (bestServer) {
      await resetRoom({ url: bestServer.url, roomId: `testing:${id}` });
    }

    return c.json({ testingLocation: values.location, testingAccessCode });
  },
);

userMinigames.patch("/:id", authMiddleware, zValidator("json", userMinigameZod), async (c) => {
  const id = c.req.param("id");
  const values = c.req.valid("json");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  if (values.previewImage) {
    const canAccessPage = await validateImageUrl(values.previewImage);
    if (!canAccessPage.success) return c.json({ code: canAccessPage.code }, canAccessPage.status);
  }

  await updateMinigameWithAuthorId({ id, authorId: c.var.user.id, ...values });
  return c.json({ success: true });
});

userMinigames.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigameByAuthorId({ id, authorId: c.var.user.id });
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  const bestServer = await findBestTestingServerByHashAndLocation({ id: minigame.id, location: minigame.testingLocation });

  await deleteMinigameWithAuthorId({ id, authorId: c.var.user.id });

  if (bestServer) {
    await resetRoom({ url: bestServer.url, roomId: `testing:${id}` });
  }

  return c.json({ success: true });
});
