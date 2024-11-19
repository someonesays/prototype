import env from "@/env";
import { z } from "zod";
import { Hono, type Context } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { createCuid, encodeRoomId, decodeRoomId } from "@/utils";
import {
  MatchmakingType,
  MessageCodes,
  type APIMatchmakingResponse,
  type APIMatchmakingResponseMetadata,
  type MatchmakingDataJWT,
} from "@/public";
import {
  checkIfRoomExists,
  getActivityInstance,
  getDiscordMember,
  getDiscordUser,
  verifyDiscordOAuth2Token,
} from "../../utils";
import { zodPostMatchmakingValidator, zodPostMatchmakingValidatorDiscord } from "./utils";

export const matchmaking = new Hono();

// Find if a room exists

matchmaking.get("/", async (c) => {
  let roomId = c.req.query("room_id");
  if (roomId?.length !== 10) return c.json({ code: MessageCodes.RoomNotFound }, 404);

  const server = await findServerByRoomIfExists(roomId);
  if (!server) return c.json({ code: MessageCodes.RoomNotFound }, 404);

  return c.json({ success: true });
});

// Create or join a room

matchmaking.post("/", zValidator("json", zodPostMatchmakingValidator), async (c) => {
  // TODO: Create a proper matchmaking system
  const payload = c.req.valid("json");

  // TODO: Add rate limit middleware
  // TODO: Add captcha

  return handlePostMatchmaking({ c, payload });
});

// The extra "/" on "/discord/" is necessary due to how Hono works.
// Hono will not accept "/discord" as "/discord/".
matchmaking.post("/discord/", zValidator("json", zodPostMatchmakingValidatorDiscord), async (c) => {
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
    case MatchmakingType.Guest: {
      // Set display name
      displayName = payload.display_name;
      avatar = `${env.BaseFrontend}/avatars/default.png`;

      // Handle finding/creating room
      if (payload.room_id) {
        roomId = payload.room_id;
        server = await findServerByRoomIfExists(roomId);
        if (!server) return c.json({ code: MessageCodes.RoomNotFound }, 404);
      } else {
        // TODO: Finish creating rooms
        // - Find the server with the least amount of rooms (aka least amount of load- using SQL) based off location
        // - If the servers are full, respond with "Servers are full. Please try again later." error
        // - Create and set the room ID and server information (fix WebSocket URL)

        const maxRetries = 3;
        let retries = 0;

        while (true) {
          // Generate new room ID based on the server ID
          roomId = encodeRoomId(env.ServerId);

          // Check if room ID is already taken on the server
          const [success, { exists }] = await checkIfRoomExists({ url: `http://localhost:3002`, roomId });
          if (!success) return c.json({ code: MessageCodes.ServersBusy }, 500);
          if (!exists) break;

          // If it fails to retry 3 times, return MessageCodes.ServersBusy
          if (++retries === maxRetries) return c.json({ code: MessageCodes.ServersBusy }, 500);
        }

        server = { id: env.ServerId, url: `ws://localhost:3002/api/rooms/ws` };
      }

      break;
    }
    case MatchmakingType.Authenticated: {
      // TODO: Add authenication for people who have accounts
      return c.json({ code: MessageCodes.NotImplemented }, 501);
    }
    case MatchmakingType.Discord: {
      if (!env.DiscordClientId || !env.DiscordClientSecret || !env.DiscordToken) {
        return c.json({ code: MessageCodes.NotImplemented }, 501);
      }

      const { instance_id: instanceId, code } = payload;

      const oauth2 = await verifyDiscordOAuth2Token(code);
      if (!oauth2) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

      const scopes = oauth2.scope.split(" ");
      if (!scopes.includes("identify") || !scopes.includes("guilds") || !scopes.includes("guilds.members.read")) {
        return c.json({ code: MessageCodes.InvalidAuthorization }, 401);
      }

      const user = await getDiscordUser(oauth2.access_token);
      if (!user) return c.json({ code: MessageCodes.InternalError }, 500);

      const instance = await getActivityInstance(instanceId);
      if (!instance) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

      displayName = user.global_name || user.username || user.id;
      avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
        : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

      const guildId = instance.location.guild_id;
      if (guildId) {
        const member = await getDiscordMember({ guildId, accessToken: oauth2.access_token });
        if (!member) return c.json({ code: MessageCodes.InternalError }, 500);

        displayName = member.nick || displayName;
        avatar = member.avatar
          ? `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}`
          : avatar;
      }

      // Set the room ID and access_token
      roomId = `discord:${instance.instance_id}`;
      discordAccessToken = oauth2.access_token;

      // TODO: Add a proper way to assign a server here
      server = { id: env.ServerId, url: `/.proxy/api/rooms/ws` };

      break;
    }
  }

  // server.url = `wss://${env.DiscordClientId}.discordsays.com/.proxy/api/rooms`; // TODO: DELETE THIS TEST FOR DISCORD

  if (!server || !roomId || !displayName || !avatar) {
    throw new Error("Either server, roomId or displayName is not defined. This should never happen.");
  }

  // Get user and room information
  const user = { id: createCuid(), displayName, avatar };
  const room = { id: roomId, server };

  // Create authorization token
  const exp = Math.trunc(Date.now() / 1000 + 300); // 5 minutes
  const data: MatchmakingDataJWT = { user, room, exp };
  const authorization = await sign(data, env.RoomJwtSecret);

  // Set metadata
  let metadata: APIMatchmakingResponseMetadata;
  switch (payload.type) {
    case MatchmakingType.Discord:
      if (!discordAccessToken) throw new Error("Missing Discord access_token on matchmaking. This should never happen.");
      metadata = { type: payload.type, access_token: discordAccessToken };
      break;
    default:
      metadata = { type: payload.type };
      break;
  }

  // Send response
  return c.json({
    authorization,
    data,
    metadata,
  } as APIMatchmakingResponse);
}

async function findServerByRoomIfExists(roomId: string) {
  const serverId = decodeRoomId(roomId);
  if (!serverId) return null;

  // TODO: Finish joining rooms
  // - Get the room from the database
  // - Make sure the WebSocket URL is the URL from the database
  // - Check if the room ID is valid

  if (serverId !== env.ServerId) return null;

  const [success, { exists }] = await checkIfRoomExists({ url: `http://localhost:${env.Port}`, roomId });
  if (!success || !exists) return null;

  return { id: serverId, url: `ws://localhost:${env.Port}/api/rooms` };
}
