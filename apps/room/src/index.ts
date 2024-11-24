import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { websocket } from "./utils";
import { api } from "./api";

const app = new Hono();

app.use(
  cors({
    origin: env.BASE_FRONTEND,
    maxAge: 600,
    credentials: true,
  }),
);

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [env.BASE_FRONTEND],
      styleSrc: [],
      imgSrc: [],
      fontSrc: [],
      connectSrc: [env.BASE_FRONTEND],
      mediaSrc: [],
      frameSrc: [env.BASE_FRONTEND],
      childSrc: [env.BASE_FRONTEND],
      workerSrc: [env.BASE_FRONTEND],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
    },
  }),
);

app.route("/api", api);

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  websocket: {
    ...websocket,
    idleTimeout: 30,
    sendPings: true,
  },
});
