import { MessageCodes } from "@/public";
import type { Context } from "hono";

export async function validateImageUrl(
  imageUrl: string,
): Promise<{ success: true } | { success: false; status: 400 | 500; code: MessageCodes }> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "user-agent": "Someone Says" },
      signal: AbortSignal.timeout(3000), // 3 seconds to complete the request
    });
    if (!res.ok) throw new Error("Request response is not OK");

    const contentType = res.headers.get("content-type") ?? "";
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(contentType)) {
      return { success: false, status: 400, code: MessageCodes.INVALID_CONTENT_TYPE };
    }

    return { success: true };
  } catch (err) {
    return { success: false, status: 500, code: MessageCodes.FAILED_TO_FETCH };
  }
}

export async function sendProxiedImage(c: Context, imageUrl: string) {
  try {
    const res = await fetch(imageUrl, {
      headers: { "user-agent": "Someone Says" },
      signal: AbortSignal.timeout(3000), // 3 seconds to complete the request
    });
    if (!res.ok) throw new Error("Request response is not OK");

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
  } catch (err) {
    return c.json({ code: MessageCodes.FAILED_TO_FETCH }, 500);
  }
}
