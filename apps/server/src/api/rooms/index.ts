import env from '@/env';
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { createWebSocketMiddleware, type MatchmakingDataJWT } from '../../utils';

export const rooms = new Hono();

// biome-ignore format: It looks prettier if this isn't seperated
rooms.get('/', createWebSocketMiddleware(async (c) => {
  const protocol = c.req.header('sec-websocket-protocol');
  if (!protocol) return;

  const { user, room } = (await verify(protocol, env.JWTSecret, env.JWTAlgorithm)) as MatchmakingDataJWT;
  return {
    open({ ws }) {
      const { user, room } = c.var.data;
      console.log('WebSocket connected');
    },
    message({ data, ws }) {
      console.log('WebSocket message', data);
    },
    close({ ws }) {
      console.log('WebSocket closed');
    },
  };
}));
