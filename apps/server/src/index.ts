import env from '@/env';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { secureHeaders } from 'hono/secure-headers';
import { websocket } from './utils/ws';
import { api } from './api';

const app = new Hono();

app.use(secureHeaders());
app.route('/api', api);

if (env.NodeEnv === 'production') {
  app.get('*', serveStatic({ root: '/build' }));
  app.get('*', serveStatic({ path: '/build/index.html' }));
} else {
  app.get('*', (c) => c.redirect(`http://localhost:${env.VitePort}${c.req.path}`));
}

export default {
  port: env.Port,
  fetch: app.fetch,
  websocket,
};
