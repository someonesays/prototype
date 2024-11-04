import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { websocket } from "./utils";
import { api } from "./api";
import { proxy } from "./proxy";

const app = new Hono();

app.route("/", proxy);

app.use(
  cors({
    origin: env.FrontendUrl,
    maxAge: 600,
    credentials: true,
  }),
);

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [env.FrontendUrl],
      styleSrc: [],
      imgSrc: [],
      fontSrc: [],
      connectSrc: [env.FrontendUrl],
      mediaSrc: [],
      frameSrc: [env.FrontendUrl],
      childSrc: [env.FrontendUrl],
      workerSrc: [env.FrontendUrl],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
    },
  }),
);

app.route("/api", api);

Bun.serve({
  port: env.Port,
  fetch: app.fetch,
  websocket: {
    ...websocket,
    idleTimeout: 30,
    sendPings: true,
  },
});
