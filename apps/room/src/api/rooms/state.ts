import env from "@/env";
import { z } from "zod";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { ErrorMessageCodes } from "@/public";
import { getServerById } from "@/db";
import { rooms, maxRooms, setMaxRooms, resetServerStartedDate, setDisabled } from "../../utils";

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
  // Check if the server is already disabled
  const room = await getServerById(env.SERVER_ID);
  if (!room) throw new Error("Cannot find room in the database");

  // Disable the server (if it's not already disabled)
  if (!room.disabled) await setDisabled(true);

  // Close all players
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      player.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVER_SHUTDOWN }));
    }
  }

  // Reset server started date (to check "iat" on the JWT)
  resetServerStartedDate(Date.now());

  // Enable the server (if it wasn't disabled originally)
  if (!room.disabled) await setDisabled(false);

  // Send response
  return c.json({ success: true });
});

// Get if a room exists
state.get("/:id", authMiddleware, async (c) => {
  const roomId = c.req.param("id");
  return c.json({ exists: !!rooms.get(roomId) });
});
