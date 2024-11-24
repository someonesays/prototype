import { MessageCodes } from "@/public";
import type { Context } from "hono";

export async function sendProxiedImage(c: Context, image: string) {
  try {
    const res = await fetch(image, { headers: { "user-agent": "Someone Says" } });
    if (!res.ok) return c.json({ code: MessageCodes.INTERNAL_ERROR }, 500);

    const contentType = res.headers.get("content-type") ?? "";
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(contentType)) {
      return c.json({ code: MessageCodes.INVALID_CONTENT_TYPE }, 400);
    }

    return c.newResponse(res.body, {
      headers: {
        "cache-control": "public, max-age=60",
        "content-type": contentType,
      },
    });
  } catch (error) {
    return c.json({ code: MessageCodes.FAILED_TO_FETCH }, 500);
  }
}
