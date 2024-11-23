import env from "@/env";
import { Hono } from "hono";
import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { MessageCodes } from "@/public";
import { createCode, getDiscordUser, verifyDiscordOAuth2Token } from "@/utils";
import { createUser, getUserByDiscordId } from "@/db";

export const auth = new Hono();

auth.get("/discord/login", async (c) => {
  const state = createCode(32);
  await setSignedCookie(c, "auth-discord-state", state, env.CookieSignature, {
    secure: true,
    expires: new Date(Date.now() + 60000),
  });
  return c.redirect(
    `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(env.DiscordClientId)}&redirect_uri=${encodeURIComponent(env.DiscordRedirectUri)}&response_type=code&scope=identify%20email&state=${encodeURIComponent(state)}&prompt=none`,
  );
});

auth.get("/discord/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const signedState = await getSignedCookie(c, env.CookieSignature, "auth-discord-state");

  deleteCookie(c, "auth-discord-state");

  if (!code || !state || (!signedState && signedState !== state)) return c.redirect(env.BaseFrontend);

  const oauth2 = await verifyDiscordOAuth2Token(code);
  if (!oauth2) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

  const scopes = oauth2.scope.split(" ");
  if (!scopes.includes("identify") || !scopes.includes("email")) {
    return c.json({ code: MessageCodes.InvalidAuthorization }, 401);
  }

  const discordUser = await getDiscordUser(oauth2.access_token);
  if (!discordUser) return c.json({ code: MessageCodes.RateLimited }, 500);

  let cid = (await getUserByDiscordId(discordUser.id))?.id;
  if (!cid) {
    cid = await createUser({
      name: discordUser.username,
      discordId: discordUser.id,
    });
  }

  const exp = Math.trunc(Date.now() / 1000 + 86400); // 1 day
  const authorization = await sign({ type: "auth", cid, exp }, env.JwtSecret);
  await setSignedCookie(c, "token", authorization, env.CookieSignature, {
    secure: true,
    expires: new Date(exp * 1000),
  });

  return c.redirect(env.BaseFrontend);
});
