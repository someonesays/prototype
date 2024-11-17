import env from "@/env";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { api } from "./api";
import { proxy } from "./proxy";

export const routes = new Hono();

routes.route("/", proxy);

routes.use(
  cors({
    origin: env.FrontendUrl,
    maxAge: 600,
    credentials: true,
  }),
);

routes.use(
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

routes.route("/api", api);
