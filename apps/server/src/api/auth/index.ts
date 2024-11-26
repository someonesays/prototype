import env from "@/env";
import { Hono } from "hono";
import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { ErrorMessageCodes } from "@/public";
import { createCode, getDiscordUser, verifyDiscordOAuth2Token } from "@/utils";
import { createUser, getUserByDiscordId } from "@/db";

export const auth = new Hono();

auth.get("/discord/login", async (c) => {
  const state = createCode(32);
  await setSignedCookie(c, "auth-discord-state", state, env.COOKIE_SIGNATURE, {
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
  const signedState = await getSignedCookie(c, env.COOKIE_SIGNATURE, "auth-discord-state");

  deleteCookie(c, "auth-discord-state");

  if (!code || !state || (!signedState && signedState !== state)) return c.redirect(env.BASE_FRONTEND);

  const oauth2 = await verifyDiscordOAuth2Token(code);
  if (!oauth2) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

  const scopes = oauth2.scope.split(" ");
  if (!scopes.includes("identify") || !scopes.includes("email")) {
    return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
  }

  const discordUser = await getDiscordUser(oauth2.access_token);
  if (!discordUser) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

  let cid = (await getUserByDiscordId(discordUser.id))?.id;
  if (!cid) {
    cid = await createUser({
      name: discordUser.username,
      discordId: discordUser.id,
    });
  }

  const exp = Math.trunc(Date.now() / 1000 + 86400); // 1 day
  const authorization = await sign({ type: "token", cid, exp }, env.JWT_SECRET);
  await setSignedCookie(c, "token", authorization, env.COOKIE_SIGNATURE, {
    secure: true,
    expires: new Date(exp * 1000),
  });

  return c.redirect(`${env.BASE_FRONTEND}/developers`);
});
