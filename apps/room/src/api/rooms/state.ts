import env from "@/env";
import { z } from "zod";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { ErrorMessageCodes } from "@/public";
import { rooms, maxRooms, setMaxRooms, resetServerStartedDate } from "../../utils";

export const state = new Hono();

const authMiddleware = createMiddleware(async (c, next) => {
  if (c.req.header("Authorization") === env.ROOMS_AUTHORIZATION) return next();
  return c.json({ code: ErrorMessageCodes.INVALID_AUTHORIZATION }, 401);
});

// Update max rooms
state.post("/", authMiddleware, zValidator("json", z.object({ maxRooms: z.number().min(0) })), async (c) => {
  await setMaxRooms(c.req.valid("json").maxRooms);
  return c.json({ maxRooms });
});

// Kill all rooms
state.delete("/", authMiddleware, async (c) => {
  // Reset server started date (to check "iat" on the JWT)
  resetServerStartedDate();
  // Close all players
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      player.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVER_SHUTDOWN }));
    }
  }
  // Send response
  return c.json({ success: true });
});

// Get if a room exists
state.get("/:id", authMiddleware, async (c) => {
  const roomId = c.req.param("id");
  return c.json({ exists: !!rooms.get(roomId) });
});
