import env from '@/env';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { createCode, createCuid } from '@/utils';
import type { MatchmakingDataJWT } from '../../utils/data';

export const matchmaking = new Hono();

matchmaking.get('/', async (c) => {
  // Get user information
  const user = {
    id: createCuid(),
    display_name: createCode(8),
  };
  // Get room information
  const room = {
    id: 'test_room_id',
    server: {
      id: 'test_server_id',
      url: `ws://localhost:${env.Port}/rooms`,
    },
  };
  // Create authorization token
  const exp = Date.now() / 1000 + 300; // 5 minutes
  const data: MatchmakingDataJWT = { user, room, exp };
  const authorization = await sign(data, env.JWTSecret, env.JWTAlgorithm);
  // Send response
  return c.json({ authorization, data });
});
