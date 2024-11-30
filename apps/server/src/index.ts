import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";

import { api } from "./api";
import { handlePostMatchmaking, zodPostMatchmakingValidatorTesting } from "./api/matchmaking/utils";

import { proxy } from "./proxy/proxy";
import { images } from "./proxy/images";

const app = new Hono();

app.route("/", proxy);
app.route("/.proxy", proxy);

app.route("/api/images", images);

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

// I added /api/matchmaking/testing to have it's own CORS settings
app.use("/api/matchmaking/testing", cors({ origin: "*" }));
app.post("/api/matchmaking/testing", zValidator("json", zodPostMatchmakingValidatorTesting), async (c) => {
  const payload = c.req.valid("json");
  return handlePostMatchmaking({ c, payload });
});

app.use(
  cors({
    origin: env.BASE_FRONTEND,
    maxAge: 600,
    credentials: true,
  }),
);

app.route("/api", api);

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});
