import env from "@/env";
import { z } from "zod";
import { Hono, type Context } from "hono";
import { getConnInfo } from "hono/bun";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import {
  createCuid,
  encodeRoomId,
  decodeRoomId,
  checkIfRoomExists,
  getActivityInstance,
  getDiscordMember,
  getDiscordUser,
  verifyDiscordOAuth2Token,
  verifyCaptcha,
} from "@/utils";
import {
  MatchmakingType,
  MessageCodes,
  type MatchmakingResponse,
  type MatchmakingResponseMetadata,
  type MatchmakingDataJWT,
} from "@/public";
import { findBestServerByLocation, findBestServerByDiscordLaunchId, getServerById } from "@/db";
import { zodPostMatchmakingValidatorNormal, zodPostMatchmakingValidatorDiscord } from "./utils";
import { roomCreationRateLimit } from "../../utils";

export const matchmaking = new Hono();

// Find if a room exists

matchmaking.get("/", async (c) => {
  let roomId = c.req.query("roomId");
  if (roomId?.length !== 10) return c.json({ code: MessageCodes.ROOM_NOT_FOUND }, 404);

  const server = await findServerByRoomIfExists(roomId);
  if (!server) return c.json({ code: MessageCodes.ROOM_NOT_FOUND }, 404);

  return c.json({ success: true });
});

// Create or join a room

matchmaking.post("/", zValidator("json", zodPostMatchmakingValidatorNormal), (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});

// The extra "/" on "/discord/" is necessary due to how Hono works.
// Hono will not accept "/discord" as "/discord/".
matchmaking.post("/discord/", zValidator("json", zodPostMatchmakingValidatorDiscord), (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});

// Functions

async function handlePostMatchmaking({
  c,
  payload,
}: {
  c: Context;
  payload: z.infer<typeof zodPostMatchmakingValidator>;
}) {
  // Get room ID
  let roomId: string | null = null;
  let displayName: string | null = null;
  let avatar: string | null = null;
  let server: MatchmakingDataJWT["room"]["server"] | null = null;

  // Discord
  let discordAccessToken: string | null = null;

  // Get server to make the room in
  switch (payload.type) {
    case MatchmakingType.NORMAL: {
      // Check captcha
      if (env.NODE_ENV !== "development") {
        const captchaType = c.req.header("X-Captcha-Type") || "invisible";
        if (
          !["invisible", "managed"].includes(captchaType) ||
          !(await verifyCaptcha({
            token: c.req.header("X-Captcha-Token") || "",
            secretKey: captchaType === "invisible" ? env.TURNSTILE_SECRET_KEY_INVISIBLE : env.TURNSTILE_SECRET_KEY_MANAGED,
          }))
        )
          return c.json({ code: MessageCodes.FAILED_CAPTCHA }, 429);
      }

      // Set display name
      displayName = payload.displayName;
      avatar = `${env.BASE_FRONTEND}/avatars/default.png`;

      // Handle finding/creating room
      if (payload.roomId) {
        roomId = payload.roomId;
        server = await findServerByRoomIfExists(roomId);
        if (!server) return c.json({ code: MessageCodes.ROOM_NOT_FOUND }, 404);
      } else {
        if (!payload.location) return c.json({ code: MessageCodes.MISSING_LOCATION }, 400);

        // Check rate limiting for room creation
        const { address: ip } = getConnInfo(c).remote;
        const success = await roomCreationRateLimit.check(`ip:${ip}`);
        if (!success) return c.json({ code: MessageCodes.RATE_LIMITED }, 400);

        // Attempt to select the server to use
        const maxRetries = 3;
        let retries = 0;

        while (true) {
          // Find the best server to use
          const bestServer = await findBestServerByLocation(payload.location);
          if (!bestServer) return c.json({ code: MessageCodes.SERVERS_BUSY }, 500);

          // Generate new room ID based on the server ID
          roomId = encodeRoomId(bestServer.id);

          // Check if room ID is already taken on the server
          const [success, { exists }] = await checkIfRoomExists({ url: bestServer.url, roomId });
          if (!success) return c.json({ code: MessageCodes.SERVERS_BUSY }, 500);
          if (!exists) {
            server = { id: bestServer.id, url: bestServer.ws, location: bestServer.location };
            break;
          }

          // If it fails to retry 3 times, return MessageCodes.SERVERS_BUSY
          if (++retries === maxRetries) return c.json({ code: MessageCodes.SERVERS_BUSY }, 500);
        }
      }

      break;
    }
    case MatchmakingType.DISCORD: {
      if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_TOKEN) {
        return c.json({ code: MessageCodes.NOT_IMPLEMENTED }, 501);
      }

      const { instanceId, code } = payload;

      const oauth2 = await verifyDiscordOAuth2Token(code);
      if (!oauth2) return c.json({ code: MessageCodes.INVALID_AUTHORIZATION }, 401);

      const scopes = oauth2.scope.split(" ");
      if (!scopes.includes("identify") || !scopes.includes("guilds") || !scopes.includes("guilds.members.read")) {
        return c.json({ code: MessageCodes.INVALID_AUTHORIZATION }, 401);
      }

      const user = await getDiscordUser(oauth2.access_token);
      if (!user) return c.json({ code: MessageCodes.RATE_LIMITED }, 500);

      const instance = await getActivityInstance(instanceId);
      if (!instance) return c.json({ code: MessageCodes.INVALID_AUTHORIZATION }, 401);

      displayName = user.global_name || user.username || user.id;
      avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

      const guildId = instance.location.guild_id;
      if (guildId) {
        const member = await getDiscordMember({ guildId, accessToken: oauth2.access_token });
        if (!member) return c.json({ code: MessageCodes.RATE_LIMITED }, 500);

        displayName = member.nick || displayName;
        avatar = member.avatar
          ? `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}`
          : avatar;
      }

      // Set the room ID and access_token
      roomId = `discord:${instance.instance_id}`;
      discordAccessToken = oauth2.access_token;

      // Assign the server based off the launch ID
      const bestServer = await findBestServerByDiscordLaunchId(BigInt(instance.launch_id));
      if (!bestServer) return c.json({ code: MessageCodes.SERVERS_BUSY }, 401);
      server = { id: bestServer.id, url: bestServer.wsDiscord, location: bestServer.location };

      break;
    }
  }

  if (!server || !roomId || !displayName || !avatar) {
    throw new Error("Either server, roomId or displayName is not defined. This should never happen.");
  }

  // Get user and room information
  const user = { id: createCuid(), displayName: displayName, avatar };
  const room = { id: roomId, server };

  // Set metadata
  let metadata: MatchmakingResponseMetadata;
  switch (payload.type) {
    case MatchmakingType.DISCORD:
      if (!discordAccessToken) throw new Error("Missing Discord access_token on matchmaking. This should never happen.");
      metadata = { type: payload.type, accessToken: discordAccessToken };
      break;
    default:
      metadata = { type: payload.type, creating: !payload.roomId };
      break;
  }

  // Create authorization token
  const exp = Math.trunc(Date.now() / 1000 + 60); // 1 minute
  const data: MatchmakingDataJWT = { type: "matchmaking", user, room, metadata, exp };
  const authorization = await sign(data, env.JWT_SECRET);

  // Send response
  return c.json({ authorization, data } as MatchmakingResponse);
}

async function findServerByRoomIfExists(roomId: string) {
  const serverId = decodeRoomId(roomId);
  if (!serverId) return null;

  const server = await getServerById(serverId);
  if (!server?.ws) return null; // Checks for .ws because it can be null

  const [success, { exists }] = await checkIfRoomExists({ url: server.url, roomId });
  if (!success || !exists) return null;

  return { id: serverId, url: server.ws, location: server.location };
}
