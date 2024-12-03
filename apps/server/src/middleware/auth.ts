import env from "@/env";
import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import { ErrorMessageCodes } from "@/public";
import { getUser, type schema } from "@/db";

export const authMiddleware = createMiddleware<{
  Variables: {
    user: typeof schema.users.$inferSelect;
  };
}>(async (c, next) => {
  try {
    const authorization = c.req.header("authorization") || "";
    const { type, cid, iat } = (await verify(authorization, env.JWT_SECRET)) as {
      type: "token";
      cid: string;
      iat: number;
      exp: number;
    };
    if (type !== "token") return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

    try {
      const user = await getUser(cid);
      if (!user) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

      const lastRevokedToken = Math.trunc(user.lastRevokedToken.getTime() / 1000);
      if (!iat || lastRevokedToken > iat) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

      c.set("user", user);
      return await next();
    } catch (err2) {
      console.error(err2);
      return c.json({ code: ErrorMessageCodes.INTERNAL_ERROR }, 500);
    }
  } catch (err) {
    return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
  }
});
