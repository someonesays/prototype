import env from '@/env';
import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { upgradeWebSocket } from '../../utils/ws';
import type { RoomMiddleware, MatchmakingDataJWT } from '../../utils/data';

export const rooms = new Hono();

rooms.get(
  '/',
  createMiddleware<RoomMiddleware>(async (c, next) => {
    if (c.req.header('upgrade') !== 'websocket') return await next();

    const protocol = c.req.header('sec-websocket-protocol');
    if (!protocol) return c.newResponse(null);

    try {
      const payload = (await verify(
        protocol,
        env.JWTSecret,
        env.JWTAlgorithm,
      )) as MatchmakingDataJWT;

      c.set('data', payload);
    } catch (err) {
      return c.newResponse(null);
    }

    return upgradeWebSocket((c: Context<RoomMiddleware>) => {
      return {
        onOpen(evt, ws) {
          const { user, room } = c.var.data;
          console.log('WebSocket connected');
        },
        onMessage(evt, ws) {
          const { data } = evt;
          console.log('WebSocket message', data);
        },
        onClose() {
          console.log('WebSocket closed');
        },
      };
    })(c, next);
  }),
);
