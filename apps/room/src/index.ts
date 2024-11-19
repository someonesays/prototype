import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { websocket } from "./utils";
import { api } from "./api";

const app = new Hono();

app.use(
  cors({
    origin: env.BaseFrontend,
    maxAge: 600,
    credentials: true,
  }),
);

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [env.BaseFrontend],
      styleSrc: [],
      imgSrc: [],
      fontSrc: [],
      connectSrc: [env.BaseFrontend],
      mediaSrc: [],
      frameSrc: [env.BaseFrontend],
      childSrc: [env.BaseFrontend],
      workerSrc: [env.BaseFrontend],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
    },
  }),
);

app.route(`/api`, api);

Bun.serve({
  port: env.Port,
  fetch: app.fetch,
  websocket: {
    ...websocket,
    idleTimeout: 30,
    sendPings: true,
  },
});
