import env from "@/env";
import { z } from "zod";
import { getConnInfo } from "hono/bun";
import { sign } from "hono/jwt";
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
  MatchmakingLocation,
  ErrorMessageCodes,
  type MatchmakingResponse,
  type MatchmakingResponseMetadata,
  type MatchmakingDataJWT,
} from "@/public";
import {
  findBestServerByLocation,
  findBestServerByDiscordLaunchId,
  getServerById,
  getMinigameByIdAndTestingAccessCode,
  findBestTestingServerByHashAndLocation,
} from "@/db";
import { roomCreationRateLimit } from "../../utils";
import type { Context } from "hono";

// Zod validators

export const zodPostMatchmakingValidatorNormal = z.object({
  type: z.literal(MatchmakingType.NORMAL),
  displayName: z.string().min(1).max(32),
  shape: z.enum(["circle", "diamond", "half", "heptagon", "hexagon", "pentagon", "square", "star", "triangle"]),
  color: z.enum(["aqua", "blue", "brown", "gray", "green", "orange", "pink", "purple", "red", "yellow"]),
  location: z.nativeEnum(MatchmakingLocation).optional(),
  roomId: z.string().length(10).optional(),
  mobile: z.boolean(),
});

export const zodPostMatchmakingValidatorTesting = z.object({
  type: z.literal(MatchmakingType.TESTING),
  displayName: z.string().min(1).max(32),
  minigameId: z.string().min(1).max(50),
  testingAccessCode: z.string(),
});

export const zodPostMatchmakingValidatorDiscord = z.object({
  type: z.literal(MatchmakingType.DISCORD),
  instanceId: z.string().min(1),
  code: z.string().min(1),
  mobile: z.boolean(),
});

export const zodPostMatchmakingValidator = z.union([
  zodPostMatchmakingValidatorNormal,
  zodPostMatchmakingValidatorTesting,
  zodPostMatchmakingValidatorDiscord,
]);

// Functions

export async function handlePostMatchmaking({
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

  // Testing
  let minigameId: string | null = null;
  let testingAccessCode: string | null = null;

  // Discord
  let discordAccessToken: string | null = null;

  // Get server to make the room in
  switch (payload.type) {
    case MatchmakingType.NORMAL: {
      // Check captcha
      const type = c.req.header("x-captcha-type") || "";
      const token = c.req.header("x-captcha-token") || "";

      if (
        !["invisible", "managed", "bypass"].includes(type) ||
        (type === "invisible" && !env.TURNSTILE_SECRET_KEY_INVISIBLE) ||
        (type === "bypass" && !env.TURNSTILE_BYPASS_SECRET)
      ) {
        return c.json({ code: ErrorMessageCodes.FAILED_CAPTCHA }, 400);
      }

      if (type === "bypass") {
        if (!env.TURNSTILE_BYPASS_SECRET || token !== env.TURNSTILE_BYPASS_SECRET) {
          return c.json({ code: ErrorMessageCodes.FAILED_CAPTCHA }, 429);
        }
      } else {
        if (
          type === "invisible" && env.TURNSTILE_SECRET_KEY_INVISIBLE
            ? !(await verifyCaptcha({ token, secretKey: env.TURNSTILE_SECRET_KEY_INVISIBLE }))
            : !(await verifyCaptcha({ token, secretKey: env.TURNSTILE_SECRET_KEY }))
        ) {
          return c.json({ code: ErrorMessageCodes.FAILED_CAPTCHA }, 429);
        }
      }

      // Set display name and avatar
      displayName = payload.displayName;
      avatar = `${env.BASE_API}/api/images/avatars/${payload.shape}/${payload.color}.png`;

      // Handle finding/creating room
      if (payload.roomId) {
        roomId = payload.roomId;

        const roomExistsData = await findServerByRoomIfExists(roomId);
        if (!roomExistsData?.exists) return c.json({ code: ErrorMessageCodes.ROOM_NOT_FOUND }, 404);
        if (roomExistsData.reachedMaxPlayers) return c.json({ code: ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT }, 403);

        server = roomExistsData.server;
      } else {
        if (!payload.location) return c.json({ code: ErrorMessageCodes.MISSING_LOCATION }, 400);

        // Check rate limiting for room creation
        const { address: ip } = getConnInfo(c).remote;
        const success = await roomCreationRateLimit.check(`ip:${ip}`);
        if (!success) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

        // Attempt to select the server to use
        const maxRetries = 3;
        let retries = 0;

        while (true) {
          // Find the best server to use
          const bestServer = await findBestServerByLocation(payload.location);
          if (!bestServer) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 500);

          // Generate new room ID based on the server ID
          roomId = encodeRoomId(bestServer.id);

          // Check if room ID is already taken on the server
          const data = await checkIfRoomExists({ url: bestServer.url, roomId });
          if (!data) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 500);
          if (!data?.exists) {
            server = { id: bestServer.id, url: bestServer.ws, location: bestServer.location };
            break;
          }

          // If it fails to retry 3 times, return ErrorMessageCodes.SERVERS_BUSY
          if (++retries === maxRetries) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 500);
        }
      }

      break;
    }
    case MatchmakingType.TESTING: {
      // Get the minidgame and check if it matches the testing access code
      const minigame = await getMinigameByIdAndTestingAccessCode({
        id: payload.minigameId,
        testingAccessCode: payload.testingAccessCode,
      });
      if (!minigame) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

      // Set display name and avatar
      displayName = payload.displayName;
      avatar = `${env.BASE_API}/api/images/avatars/default.png`;

      // Set the minigame metadata information
      minigameId = minigame.id;
      testingAccessCode = minigame.testingAccessCode;

      // Set the room ID
      roomId = `testing:${minigame.id}`;

      // Assign the server based off the minigame id and location
      const bestServer = await findBestTestingServerByHashAndLocation({
        id: minigame.id,
        location: minigame.testingLocation,
      });
      if (!bestServer) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 401);
      server = { id: bestServer.id, url: bestServer.wsTesting, location: bestServer.location };

      break;
    }
    case MatchmakingType.DISCORD: {
      if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_TOKEN) {
        return c.json({ code: ErrorMessageCodes.NOT_IMPLEMENTED }, 501);
      }

      const { instanceId, code } = payload;

      const oauth2 = await verifyDiscordOAuth2Token({
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        redirectUri: env.DISCORD_REDIRECT_URI,
        code,
      });
      if (!oauth2) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

      const scopes = oauth2.scope.split(" ");
      if (
        !scopes.includes("identify") ||
        !scopes.includes("guilds") ||
        !scopes.includes("guilds.members.read") ||
        !scopes.includes("rpc.activities.write")
      ) {
        return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
      }

      const user = await getDiscordUser(oauth2.access_token);
      if (!user) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

      const instance = await getActivityInstance(instanceId);
      if (!instance) return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);

      displayName = user.global_name || user.username || user.id;
      avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

      const guildId = instance.location.guild_id;
      if (guildId) {
        const member = await getDiscordMember({ guildId, accessToken: oauth2.access_token });
        if (!member) return c.json({ code: ErrorMessageCodes.RATE_LIMITED }, 429);

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
      if (!bestServer) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 401);
      server = { id: bestServer.id, url: bestServer.wsDiscord, location: bestServer.location };

      break;
    }
  }

  if (!server || !roomId || !displayName || !avatar) {
    throw new Error("Either server, roomId or displayName is not defined. This should never happen.");
  }

  // Get user and room information
  const user = { id: createCuid(), displayName, avatar };
  const room = { id: roomId, server };

  // Set metadata
  let metadata: MatchmakingResponseMetadata;
  switch (payload.type) {
    case MatchmakingType.NORMAL:
      metadata = { type: MatchmakingType.NORMAL, creating: !payload.roomId, mobile: payload.mobile };
      break;
    case MatchmakingType.TESTING:
      if (!minigameId || !testingAccessCode) {
        throw new Error("Missing testing minigameId and/or testingAccessCode on matchmaking. This should never happen.");
      }
      metadata = { type: MatchmakingType.TESTING, minigameId, testingAccessCode };
      break;
    case MatchmakingType.DISCORD:
      if (!discordAccessToken) throw new Error("Missing Discord accessToken on matchmaking. This should never happen.");
      metadata = { type: MatchmakingType.DISCORD, accessToken: discordAccessToken, mobile: payload.mobile };
      break;
  }

  // Create authorization token
  const iat = Math.trunc(Date.now() / 1000);
  const exp = iat + 60; // 1 minute
  const data: MatchmakingDataJWT = { type: "matchmaking", user, room, metadata, iat, exp };
  const authorization = await sign(data, env.JWT_SECRET);

  // Send response
  return c.json({ authorization, data } as MatchmakingResponse);
}

export async function findServerByRoomIfExists(roomId: string) {
  const serverId = decodeRoomId(roomId);
  if (!serverId) return null;

  const server = await getServerById(serverId);
  if (!server?.ws) return null; // Checks for .ws because it can be null

  const data = await checkIfRoomExists({ url: server.url, roomId });
  if (!data) return null;

  return {
    exists: data.exists,
    reachedMaxPlayers: data.reachedMaxPlayers,
    server: { id: serverId, url: server.ws, location: server.location },
  };
}
