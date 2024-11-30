import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";

import { api } from "./api";
import { handlePostMatchmaking, zodPostMatchmakingValidatorTesting } from "./api/matchmaking/utils";

import { proxy } from "./proxy";

const app = new Hono();

app.route("/", proxy);
app.route("/.proxy", proxy);

app.use((c, next) => {
  let origin = env.BASE_FRONTEND;

  const userOrigin = c.req.header("origin");
  let usingLocalhost = false;
  if (env.NODE_ENV !== "production" && userOrigin?.startsWith("http://localhost")) {
    // Allow localhost to be origin for development and staging
    usingLocalhost = true;
    origin = userOrigin;
  }

  return secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [origin],
      styleSrc: [],
      imgSrc: [],
      fontSrc: [],
      connectSrc: [origin],
      mediaSrc: [],
      frameSrc: [origin],
      childSrc: [origin],
      workerSrc: [origin],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
    },
    crossOriginResourcePolicy: usingLocalhost ? "cross-origin" : "same-origin",
  })(c, next);
});

// I added /api/matchmaking/testing to have it's own CORS settings
app.use("/api/matchmaking/testing", cors({ origin: "*" }));
app.post("/api/matchmaking/testing", zValidator("json", zodPostMatchmakingValidatorTesting), async (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});

app.use((c, next) => {
  let origin = env.BASE_FRONTEND;

  const userOrigin = c.req.header("origin");
  if (env.NODE_ENV !== "production" && userOrigin?.startsWith("http://localhost")) {
    // Allow localhost to be origin for development and staging
    origin = userOrigin;
  }

  return cors({
    origin,
    maxAge: 600,
    credentials: true,
  })(c, next);
});

app.route("/api", api);

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});
