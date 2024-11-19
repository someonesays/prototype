import env from "@/env";
import { Hono } from "hono";
import { MessageCodes } from "@/public";
import { rooms } from "../../utils";

export const state = new Hono();

state.get("/:id", async (c) => {
  if (c.req.header("Authorization") !== env.RoomAuthorization) {
    return c.json({ code: MessageCodes.InvalidAuthorization }, 401);
  }
  const roomId = c.req.param("id");
  return c.json({ exists: !!rooms.get(roomId) });
});
