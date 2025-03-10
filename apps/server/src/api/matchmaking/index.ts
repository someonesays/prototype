import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ErrorMessageCodes } from "@/public";
import {
  zodPostMatchmakingValidatorNormal,
  zodPostMatchmakingValidatorDiscord,
  findServerByRoomIfExists,
  handlePostMatchmaking,
} from "./utils";

export const matchmaking = new Hono();

// Find if a room exists

matchmaking.get("/", async (c) => {
  let roomId = c.req.query("roomId");
  if (roomId?.length !== 10) return c.json({ code: ErrorMessageCodes.ROOM_NOT_FOUND }, 404);

  const roomExistsData = await findServerByRoomIfExists(roomId);
  if (!roomExistsData?.exists) return c.json({ code: ErrorMessageCodes.ROOM_NOT_FOUND }, 404);

  return c.json({ success: true });
});

// Create or join a room

matchmaking.post("/", zValidator("json", zodPostMatchmakingValidatorNormal), (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});

matchmaking.post("/discord", zValidator("json", zodPostMatchmakingValidatorDiscord), (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});
