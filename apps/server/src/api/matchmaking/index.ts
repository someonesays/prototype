import env from "@/env";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { createCuid, encodeRoomId, decodeRoomId } from "@/utils";
import { MessageCodes, type MatchmakingDataJWT } from "@/public";
import { checkIfRoomExists } from "../../utils";
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
    z.object({
      display_name: z.string().min(2).max(32),
      room_id: z.string().length(8).optional(),
    }),
  ),
  async (c) => {
    // TODO: Create a proper matchmaking system

    let { display_name: displayName, room_id: roomId } = c.req.valid("json");

    // TODO: Add captcha and Discord OAuth2 support

    // Get room ID
    let server: MatchmakingDataJWT["room"]["server"] | null;

    if (roomId) {
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
