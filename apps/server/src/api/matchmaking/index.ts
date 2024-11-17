import env from "@/env";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { createCuid, encodeRoomId, decodeRoomId } from "@/utils";
import { MatchmakingType, MessageCodes, type MatchmakingDataJWT } from "@/public";
import {
  checkIfRoomExists,
  getActivityInstance,
  getDiscordMember,
  getDiscordUser,
  verifyDiscordOAuth2Token,
} from "../../utils";
import { z } from "zod";

export const matchmaking = new Hono();

matchmaking.get("/", async (c) => {
  let roomId = c.req.query("room_id");
  if (roomId?.length !== 8) return c.json({ code: MessageCodes.RoomNotFound }, 404);

  const server = await findServerByRoomIfExists(roomId);
  if (!server) return c.json({ code: MessageCodes.RoomNotFound }, 404);

  return c.json({ success: true });
});

matchmaking.post(
  "/",
  zValidator(
    "json",
    z.union([
      z.object({
        type: z.literal(MatchmakingType.Normal),
        display_name: z.string().min(1).max(32),
        room_id: z.string().length(8).optional(),
      }),
      z.object({
        type: z.literal(MatchmakingType.Discord),
        activity_id: z.string().min(1),
        code: z.string().min(1),
      }),
    ]),
  ),
  async (c) => {
    // TODO: Create a proper matchmaking system

    const payload = c.req.valid("json");
    const { type } = payload;

    // TODO: Add captcha and Discord OAuth2 support

    // Get room ID
    let roomId: string | null = null;
    let displayName: string | null = null;
    let server: MatchmakingDataJWT["room"]["server"] | null = null;

    switch (type) {
      case MatchmakingType.Normal: {
        // Set display name
        displayName = payload.display_name;

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
            const { exists } = await checkIfRoomExists({ url: `http://localhost:${env.Port}`, roomId });
            if (!exists) break;

            // If it fails to retry 3 times, return MessageCodes.ServersBusy
            if (++retries === maxRetries) return c.json({ code: MessageCodes.ServersBusy }, 500);
          }

          server = { id: env.ServerId, url: `ws://localhost:${env.Port}/api/rooms` };
        }

        break;
      }
      case MatchmakingType.Discord: {
        if (!env.DiscordClientId || !env.DiscordClientSecret || !env.DiscordToken) {
          return c.json({ code: MessageCodes.NotImplemented }, 501);
        }

        const { activity_id: activityId, code } = payload;

        const oauth2 = await verifyDiscordOAuth2Token(code);
        if (oauth2?.scope !== "guilds.members.read identify") {
          return c.json({ code: MessageCodes.InvalidAuthorization }, 401);
        }

        const user = await getDiscordUser(oauth2.access_token);
        if (!user) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

        const instance = await getActivityInstance(activityId);
        if (!instance) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

        displayName = user.global_name || user.username || user.id;

        const guildId = instance.location.guild_id;
        if (guildId) {
          const member = await getDiscordMember({ guildId, accessToken: oauth2.access_token });
          if (!member) return c.json({ code: MessageCodes.InvalidAuthorization }, 401);

          displayName = member.nick || displayName;
        }

        roomId = `discord:${instance.instance_id}`;

        // TODO: Add a proper way to assign a server here
        server = { id: env.ServerId, url: `wss://${env.DiscordClientId}.discordsays.com/.proxy/api/rooms` };

        break;
      }
    }

    // server.url = `wss://${env.DiscordClientId}.discordsays.com/.proxy/api/rooms`; // TODO: DELETE THIS TEST FOR DISCORD

    if (!server || !roomId || !displayName) {
      throw new Error("Either server, roomId or displayName is not defined. This should never happen.");
    }

    // Get user and room information
    const user = { id: createCuid(), displayName };
    const room = { id: roomId, server };

    // Create authorization token
    const exp = Date.now() / 1000 + 300; // 5 minutes
    const data: MatchmakingDataJWT = { user, room, exp };
    const authorization = await sign(data, env.JWTSecret, env.JWTAlgorithm);

    // Send response
    return c.json({ authorization, data });
  },
);

async function findServerByRoomIfExists(roomId: string) {
  const decodedRoomId = decodeRoomId(roomId);
  if (!decodedRoomId) return null;

  // TODO: Finish joining rooms
  // - Get the room from the database
  // - Make sure the WebSocket URL is the URL from the database
  // - Check if the room ID is valid

  if (decodedRoomId.serverId !== env.ServerId) return null;

  const { exists } = await checkIfRoomExists({ url: `http://localhost:${env.Port}`, roomId });
  if (!exists) return null;

  return { id: decodedRoomId.serverId, url: `ws://localhost:${env.Port}/api/rooms` };
}
