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
  const authorization = (await getSignedCookie(c, env.COOKIE_SIGNATURE, "token")) || "";

  try {
    const { type, cid } = (await verify(authorization, env.JWT_SECRET)) as { type: "token"; cid: string };
    if (type !== "token") return c.json({ code: MessageCodes.INVALID_AUTHORIZATION });

    try {
      const user = await getUser(cid);
      if (!user) return c.json({ code: MessageCodes.INVALID_AUTHORIZATION });

      c.set("user", user);
      return await next();
    } catch (err2) {
      console.error(err2);
      return c.json({ code: MessageCodes.INTERNAL_ERROR });
    }
  } catch (err) {
    return c.json({ code: MessageCodes.INVALID_AUTHORIZATION });
  }
});
