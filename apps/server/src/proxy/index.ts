import env from "@/env";
import { getMinigame } from "@/db";
import { MinigamePathType } from "@/public";
import { Hono, type Context } from "hono";
import { NONCE, secureHeaders } from "hono/secure-headers";
import type { BlankEnv } from "hono/types";

export const proxy = new Hono();
const route = "/api/proxy/:minigameId/*";

proxy.use(route, async (c, next) => {
  const { proxyHref } = await getProxy(c);

  const fetchMetadata = c.req.header("Sec-Fetch-Dest");
  if (!fetchMetadata) return c.text("Missing Sec-Fetch-Dest header. Have you updated your browser?", 401);
  if (fetchMetadata === "document") return c.text("Cannot access page as a document.", 401);

  return secureHeaders({
    originAgentCluster: "",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: [
        "https://cdn.discordapp.com/avatars/",
        "https://media.discordapp.net/avatars/",
        "https://cdn.discordapp.com/embed/",
        "https://media.discordapp.net/embed/",
        "https://cdn.discordapp.com/guilds/",
        "https://media.discordapp.net/guilds/",
        "'self'",
        "blob:",
        "data:",
      ],
      fontSrc: ["'self'", "data:"],
      connectSrc: [
        proxyHref,
        "https://cdn.discordapp.com/avatars/",
        "https://media.discordapp.net/avatars/",
        "https://cdn.discordapp.com/embed/",
        "https://media.discordapp.net/embed/",
        "https://cdn.discordapp.com/guilds/",
        "https://media.discordapp.net/guilds/",
        "data:",
        "blob:",
      ],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [proxyHref],
      childSrc: [proxyHref, "blob:"],
      workerSrc: [proxyHref, "blob:"],
      frameAncestors: ["'self'", env.FrontendUrl],
      baseUri: ["'self'"],
    },
    xFrameOptions: "",
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

  const absolutePath = `/.proxy/api/proxy/${minigame.id}/`;
  const query = Object.entries(c.req.query()).length ? `?${new URLSearchParams(c.req.query())}` : "";

  let path: string;
  if (c.req.path.startsWith("/.proxy")) {
    // Normal implementation
    path = minigame.pathType === MinigamePathType.Original ? c.req.path.slice(absolutePath.length) : c.req.path;
  } else {
    // Discord implementation
    path =
      minigame.pathType === MinigamePathType.Original
        ? c.req.path.slice(absolutePath.length - "/.proxy".length)
        : `/.proxy${c.req.path}`;
  }

  const http = minigame.urlSecure ? "https" : "http";
  // const ws = minigame.urlSecure ? "wss" : "ws";

  const href = `${http}://${minigame.urlHost}`;
  const url = `${href}${path}${query}`;
  const proxyHref = `${env.ViteBaseApi}${absolutePath}`;

  return { proxyHref, url };
}
