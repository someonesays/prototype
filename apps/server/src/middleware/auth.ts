import env from "@/env";
import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import { MessageCodes } from "@/public";
import { getUser, type schema } from "@/db";
import { getSignedCookie } from "hono/cookie";

export const authMiddleware = createMiddleware<{
  Variables: {
    user: typeof schema.users.$inferSelect;
  };
}>(async (c, next) => {
  const authorization = (await getSignedCookie(c, env.CookieSignature, "token")) || "";

  try {
    const { type, cid } = (await verify(authorization, env.JwtSecret)) as { type: "token"; cid: string };
    if (type !== "token") return c.json({ code: MessageCodes.InvalidAuthorization });

    try {
      const user = await getUser(cid);
      if (!user) return c.json({ code: MessageCodes.InvalidAuthorization });

      c.set("user", user);
      return await next();
    } catch (err2) {
      console.error(err2);
      return c.json({ code: MessageCodes.InternalError });
    }
  } catch (err) {
    return c.json({ code: MessageCodes.InvalidAuthorization });
  }
});
