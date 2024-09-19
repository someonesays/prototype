import env from "@/env";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createWebSocketMiddleware, type MatchmakingDataJWT } from "../../utils";

export const rooms = new Hono();

// biome-ignore format: It looks prettier if this isn't seperated
rooms.get('/', createWebSocketMiddleware(async (c) => {
  const protocol = c.req.header('sec-websocket-protocol');
  if (!protocol) return;

  const { user, room } = (await verify(protocol, env.JWTSecret, env.JWTAlgorithm)) as MatchmakingDataJWT;
  if (room.server.id !== "test_server_id") return;

  // Do not create any timeouts, intervals or events outside the open() function.
  const state = {
    connected: false,
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
