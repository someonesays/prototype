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

// Reset all rooms
let resetting = false;
state.delete("/", authMiddleware, async (c) => {
  // Check if the server is already disabled
  const room = await getServerById(env.SERVER_ID);
  if (!room) return c.json({ code: ErrorMessageCodes.NOT_FOUND }, 500);

  // Disallow race-conditioning this endpoint
  if (resetting) return c.json({ code: ErrorMessageCodes.SERVERS_BUSY }, 429);
  resetting = true;

  try {
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
    resetting = false;
    return c.json({ success: true });
  } catch (err) {
    // On failure, log the error and return a failure response
    console.error(err);
    resetting = false;
    return c.json({ code: ErrorMessageCodes.UNEXPECTED_ERROR }, 500);
  }
});

// Get if a room exists
state.get("/:id", authMiddleware, async (c) => {
  const roomId = c.req.param("id");
  return c.json({ exists: !!rooms.get(roomId) });
});

// Delete/reset a room
state.delete("/:id", authMiddleware, async (c) => {
  const roomId = c.req.param("id");

  const room = rooms.get(roomId);
  if (!room) return c.json({ code: ErrorMessageCodes.ROOM_NOT_FOUND });

  for (const player of room.players.values()) {
    player.ws.close(1003, JSON.stringify({ code: ErrorMessageCodes.SERVER_SHUTDOWN }));
  }

  return c.json({ success: true });
});
