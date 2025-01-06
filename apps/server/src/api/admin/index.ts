import z from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { featureMinigames, getMinigame, getMinigames, updateMinigame } from "@/db";
import { authMiddleware, adminMiddleware } from "../../middleware";
import { getOffsetAndLimit } from "../../utils";
import { ErrorMessageCodes } from "@/public";

export const admin = new Hono();

admin.get("/minigames", authMiddleware, adminMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  return c.json(await getMinigames({ offset, limit }));
});

admin.get("/minigames/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const minigame = await getMinigame(id);
  if (!minigame) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404);

  return c.json(minigame);
});

admin.get("/reviews", authMiddleware, adminMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  return c.json(await getMinigames({ underReview: true, offset, limit }));
});

admin.post("/publish-access/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await updateMinigame({ id, underReview: null, canPublish: true });
  return c.json({ success: true });
});

admin.delete("/publish-access/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await updateMinigame({ id, underReview: null, canPublish: false });
  return c.json({ success: true });
});

admin.get("/official", authMiddleware, adminMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  const minigames = await getMinigames({ include: ["official"], offset, limit });
  return c.json({ minigames });
});

admin.post("/official/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await updateMinigame({ id, official: true });
  return c.json({ success: true });
});

admin.delete("/official/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await updateMinigame({ id, official: false });
  return c.json({ success: true });
});

admin.get("/currently-featured", authMiddleware, adminMiddleware, async (c) => {
  const { offset, limit } = getOffsetAndLimit(c);
  const minigames = await getMinigames({ include: ["currently_featured"], offset, limit });
  return c.json({ minigames });
});

admin.post(
  "/currently-featured",
  authMiddleware,
  adminMiddleware,
  zValidator(
    "json",
    z.object({
      ids: z.array(z.string().min(1).max(50)),
    }),
  ),
  async (c) => {
    const { ids } = c.req.valid("json");

    await featureMinigames(ids);
    return c.json({ success: true });
  },
);
