import env from "@/env";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { createCode, createCuid } from "@/utils";
import type { MatchmakingDataJWT } from "@/sdk";

export const matchmaking = new Hono();

matchmaking.get("/", async (c) => {
  // TODO: Create a proper matchmaking system

  // Get room ID
  const roomId = c.req.query("room_id");

  // Get user information
  const user = {
    id: createCuid(),
    displayName: c.req.query("display_name") || `Guest_${createCode(4)}`,
  };

  // Get room information
  const room = {
    id: "test_room_id",
    server: {
      id: env.ServerId,
      url: `ws://localhost:${env.Port}/api/rooms`,
    },
  };

  // Create authorization token
  const exp = Date.now() / 1000 + 300; // 5 minutes
  const data: MatchmakingDataJWT = { user, room, exp };
  const authorization = await sign(data, env.JWTSecret, env.JWTAlgorithm);

  // Send response
  return c.json({ authorization, data });
});
