import env from "@/env";
import { getMinigame } from "@/db";
import { ErrorMessageCodes, MinigamePathType } from "@/public";
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

  const frameAncestors = ["'self'", env.BASE_FRONTEND];
  if (env.NODE_ENV !== "production") {
    // Add localhost:3000 to the frame ancestor in development and staging environments
    frameAncestors.push("http://localhost:3000");
  }

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
      frameAncestors,
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
      signal: AbortSignal.timeout(60000), // 1 minute to complete the request
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
    return c.json({ code: ErrorMessageCodes.FAILED_TO_FETCH }, 500);
  }
});

async function getProxy(c: Context<BlankEnv, typeof route>) {
  const minigameId = c.req.param("minigameId");
  const minigame = await getMinigame(minigameId);

  if (!minigame?.proxyUrl) throw new Error("Invalid minigame ID or missing proxy URL");

  const absolutePath = `/.proxy/api/proxy/${minigame.id}/`;
  const query = Object.entries(c.req.query()).length ? `?${new URLSearchParams(c.req.query())}` : "";

  let path: string;
  if (c.req.path.startsWith("/.proxy")) {
    // Normal implementation
    path = minigame.pathType === MinigamePathType.ORIGINAL ? c.req.path.slice(absolutePath.length) : c.req.path;
  } else {
    // Discord implementation
    path =
      minigame.pathType === MinigamePathType.ORIGINAL
        ? c.req.path.slice(absolutePath.length - "/.proxy".length)
        : `/.proxy${c.req.path}`;
  }

  const href = minigame.proxyUrl;
  const url = `${href}${path}${query}`;
  const proxyHref = `${env.BASE_API}${absolutePath}`;

  return { proxyHref, url };
}
