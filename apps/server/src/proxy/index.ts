import env from "@/env";
import { getMinigame } from "@/db";
import { MinigameType } from "@/public";
import { Hono, type Context } from "hono";
import { NONCE, secureHeaders } from "hono/secure-headers";
import type { BlankEnv } from "hono/types";

export const proxy = new Hono();
const route = "/api/proxy/:minigameId/*";

proxy.use(route, async (c, next) => {
  const { proxyHref } = await getProxy(c);

  const fetchMetadata = c.req.header("Sec-Fetch-Dest");
  if (!fetchMetadata) {
    return c.text("Missing Sec-Fetch-Dest header. Have you updated your browser?", 401);
  } else if (fetchMetadata === "document") {
    return c.text("Cannot access page as a document.", 401);
  }

  return secureHeaders({
    originAgentCluster: "",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [proxyHref, "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [proxyHref],
      childSrc: [proxyHref, "blob:"],
      workerSrc: [proxyHref, "blob:"],
      frameAncestors: ["'self'", env.FrontendUrl],
      baseUri: ["'self'"],
    },
    crossOriginResourcePolicy: "",
  })(c, next);
});

proxy.all(route, async (c) => {
  const { url } = await getProxy(c);
  try {
    // Handle fetch
    const res = await fetch(url, {
      method: c.req.method,
      body: c.req.raw.body,
      headers: {
        ...c.req.raw.headers,
        "user-agent": "Someone Says",
      },
    });
    if (res.status === 101) return c.newResponse(null);

    return c.newResponse(res.body, {
      status: res.status,
      headers: {
        ...res.headers,
        "access-control-allow-origin": "*",
        "content-type": res.headers.get("content-type") ?? "",
      },
    });
  } catch (err) {
    return c.text("Cannot connect to URL", 404);
  }
});

async function getProxy(c: Context<BlankEnv, typeof route>) {
  const minigameId = c.req.param("minigameId");
  const minigame = await getMinigame(minigameId);
  if (!minigame) throw new Error("Invalid minigame ID");

  const path = minigame.urlType === MinigameType.Original ? c.req.path.slice(minigameId.length + 12) : c.req.path;

  const http = minigame.urlSecure ? "https" : "http";
  // const ws = minigame.urlSecure ? "wss" : "ws";

  const absolutePath = `/api/proxy/${minigame.id}/`;
  const query = Object.entries(c.req.query()).length ? `?${new URLSearchParams(c.req.query())}` : "";

  const href = `${http}://${minigame.urlHost}`;
  const url = `${href}${path}${query}`;
  const proxyHref = `${env.ViteBaseApi}${absolutePath}`;

  return { proxyHref, url };
}
