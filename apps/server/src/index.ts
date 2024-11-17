import env from "@/env";
import { Hono } from "hono";
import { websocket } from "./utils";

import { routes } from "./routes";

const app = new Hono();

app.route("/", routes);
app.route("/.proxy", routes);

Bun.serve({
  port: env.Port,
  fetch: app.fetch,
  websocket: {
    ...websocket,
    idleTimeout: 30,
    sendPings: true,
  },
});
