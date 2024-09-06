import env from "@/env";
import { Hono } from "hono";
import { serve } from "./utils";
import { NONCE, secureHeaders } from "hono/secure-headers";
import { websocket } from "./utils";
import { api } from "./api";
import { proxy } from "./proxy";

const app = new Hono();

app.route("/api/proxy", proxy);

const url = "http://localhost:3001";
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [url, "'self'", "'unsafe-eval'", "'unsafe-inline'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [url, "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [url],
      childSrc: [url, "blob:"],
      workerSrc: [url, "blob:"],
    },
  }),
);
app.route("/api", api);

if (env.NodeEnv === "production") {
  app.get(
    "*",
    serve({
      root: "/build",
      inject: (c, html) =>
        html.replace(/<script/g, `<script nonce="${c.get("secureHeadersNonce")}"`),
    }),
  );
  app.get(
    "*",
    serve({
      path: "/build/index.html",
      inject: (c, html) =>
        html.replace(/<script/g, `<script nonce="${c.get("secureHeadersNonce")}"`),
    }),
  );
} else {
  app.get("*", (c) => c.redirect(`http://localhost:${env.VitePort}${c.req.path}`));
}

export default {
  port: env.Port,
  fetch: app.fetch,
  websocket,
};
