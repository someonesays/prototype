import env from "@/env";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { ErrorMessageCodes } from "@/public";
import { getDiscordUser, verifyDiscordOAuth2Token } from "@/utils";
import { createUser, getUserByDiscordId } from "@/db";

export const auth = new Hono();

auth.get("/discord/login", async (c) => {
  const state = c.req.query("state");
  const local = env.NODE_ENV !== "production" && c.req.query("local")?.toLowerCase() === "true";

  const redirectUri = local ? "http://localhost:3000/auth/discord" : env.DISCORD_REDIRECT_URI;
  return c.redirect(
    `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(env.DISCORD_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email${state ? `&state=${encodeURIComponent(state)}` : ""}&prompt=none`,
  );
});

auth.get("/discord/callback", async (c) => {
  const code = c.req.query("code");
  const local = env.NODE_ENV !== "production" && c.req.query("local")?.toLowerCase() === "true";

  if (!code) {
    return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
  }

  const oauth2 = await verifyDiscordOAuth2Token({
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: local ? "http://localhost:3000/auth/discord" : env.DISCORD_REDIRECT_URI,
    code,
  });
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

  const iat = Math.trunc(Date.now() / 1000);
  const exp = iat + 86400; // 1 day
  const authorization = await sign({ type: "token", cid, iat, exp }, env.JWT_SECRET);

  return c.json({ authorization });
});
