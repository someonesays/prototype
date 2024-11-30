import env from "@/env";
import { Hono } from "hono";
import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { ErrorMessageCodes } from "@/public";
import { createCode, getDiscordUser, verifyDiscordOAuth2Token } from "@/utils";
import { createUser, getUserByDiscordId } from "@/db";

export const auth = new Hono();

auth.get("/discord/login", async (c) => {
  const local = env.NODE_ENV !== "production" && c.req.query("local")?.toLowerCase() === "true";
  const state = createCode(32);
  await setSignedCookie(c, "auth-discord-state", JSON.stringify({ local, state }), env.COOKIE_SIGNATURE, {
    secure: true,
    expires: new Date(Date.now() + 60000),
  });
  return c.redirect(
    `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(env.DISCORD_CLIENT_ID)}&redirect_uri=${encodeURIComponent(env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email&state=${encodeURIComponent(state)}&prompt=none`,
  );
});

auth.get("/discord/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const signedCookie = await getSignedCookie(c, env.COOKIE_SIGNATURE, "auth-discord-state");

  deleteCookie(c, "auth-discord-state");

  console.log(1, signedCookie);

  if (!signedCookie) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

  console.log(2);

  let isLocal: boolean;
  let signedState: string;
  try {
    const parsedSignCookie = JSON.parse(signedCookie) as { local: boolean; state: string };
    if (
      typeof parsedSignCookie !== "object" ||
      Array.isArray(parsedSignCookie) ||
      parsedSignCookie === null ||
      typeof parsedSignCookie.local !== "boolean" ||
      typeof parsedSignCookie.state !== "string" ||
      (env.NODE_ENV === "production" && parsedSignCookie.local)
    ) {
      throw new Error("Invalid parsed signed cookie for Discord OAuth2");
    }

    console.log(3);

    isLocal = parsedSignCookie.local;
    signedState = parsedSignCookie.state;
  } catch (err) {
    console.error(err);
    return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
  }

  if (!code || !state || (!signedState && signedState !== state)) return c.redirect(env.BASE_FRONTEND);

  console.log(4);

  const oauth2 = await verifyDiscordOAuth2Token(code);
  if (!oauth2) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

  console.log(5);

  const scopes = oauth2.scope.split(" ");
  if (!scopes.includes("identify") || !scopes.includes("email")) {
    return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
  }

  console.log(6);

  const discordUser = await getDiscordUser(oauth2.access_token);
  if (!discordUser) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

  console.log(7);

  let cid = (await getUserByDiscordId(discordUser.id))?.id;
  if (!cid) {
    cid = await createUser({
      name: discordUser.username,
      discordId: discordUser.id,
    });
  }

  console.log(8);

  const exp = Math.trunc(Date.now() / 1000 + 86400); // 1 day
  const authorization = await sign({ type: "token", cid, exp }, env.JWT_SECRET);
  await setSignedCookie(c, "token", authorization, env.COOKIE_SIGNATURE, {
    secure: true,
    expires: new Date(exp * 1000),
  });

  console.log(9);

  if (isLocal) return c.redirect("http://localhost:3000/developers");
  return c.redirect(`${env.BASE_FRONTEND}/developers`);
});
