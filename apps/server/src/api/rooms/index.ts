import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createWebSocketMiddleware, type MatchmakingDataJWT } from "../../utils";
import { ClientOpcodes, ServerOpcodes } from "@/sdk";

export const rooms = new Hono();

// biome-ignore format: It looks prettier if this isn't seperated
rooms.get('/', createWebSocketMiddleware(async (c) => {
  const protocol = c.req.header('sec-websocket-protocol');
  if (!protocol) return;

  const { user, room } = (await verify(protocol, env.JWTSecret, env.JWTAlgorithm)) as MatchmakingDataJWT;
  if (room.server.id !== "test_server_id") return;

  // Make sure 2 clients cannot join with the same user ID
  // Make functions for finding rooms and make sure to check if a room has to be created or not
  // Make sure to check if the server is full and if it is, disallow the room from being created in the first place

  const state = {
    connected: false,
    room: {
      id: room.id,
    },
    user: {
      id: user.id,
      displayName: user.display_name,
    },
  };
  
  return {
    open({ ws }) {
      state.connected = true;

      console.log('WebSocket connected');
    },
    message({ data, ws }) {
      console.log('WebSocket message', data);
    },
    close({ ws }) {
      state.connected = false;

      console.log('WebSocket closed');
    },
    error({ ws }) {
      state.connected = false;

      console.log('WebSocket errored');
    },
  };
}));
