import env from "@/env";
import { getPrompt } from "@/db";
import { PromptType } from "@/public";
import { Hono, type Context } from "hono";
import { NONCE, secureHeaders } from "hono/secure-headers";
import { developmentCsp } from "../utils";
import type { BlankEnv } from "hono/types";

export const proxy = new Hono();

const route = "/api/proxy/:promptId/*";

proxy.use(route, async (c, next) => {
  const { proxyHref, proxyWebsocket } = await getProxy(c);
  return secureHeaders({
    originAgentCluster: "",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [...developmentCsp, proxyHref, proxyWebsocket, "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [...developmentCsp, proxyHref],
      childSrc: [...developmentCsp, proxyHref, "blob:"],
      workerSrc: [...developmentCsp, proxyHref, "blob:"],
    },
    xFrameOptions: "SAMEORIGIN",
    crossOriginResourcePolicy: "same-site",
  })(c, next);
});

proxy.all(route, async (c) => {
  const { url } = await getProxy(c);
  try {
    const res = await fetch(url, {
      method: c.req.method,
      headers: { "user-agent": "Someone Says" },
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        "access-control-allow-origin": "*",
        "content-type": res.headers.get("content-type") ?? "",
      },
    });
  } catch (err) {
    return c.text("Cannot connect to URL", 404);
  }
});

async function getProxy(c: Context<BlankEnv, typeof route>) {
  const promptId = c.req.param("promptId");
  const prompt = await getPrompt(promptId);
  if (!prompt) throw new Error("Invalid prompt ID");

  const path =
    prompt.urlType === PromptType.Original ? c.req.path.slice(promptId.length + 12) : c.req.path;

  const http = prompt.urlSecure ? "https" : "http";
  const query = Object.entries(c.req.query()).length
    ? `?${new URLSearchParams(c.req.query())}`
    : "";

  const absolutePath = `/api/proxy/${prompt.id}/`;

  const href = `${http}://${prompt.urlHost}`;
  const proxyHref = `${env.Domain}${absolutePath}`;
  const proxyWebsocket = `${env.Websocket}${absolutePath}`;

  const url = `${href}${path}${query}`;
  // const proxyUrl = `${proxyHref}${path}${query}`;

  return { proxyHref, proxyWebsocket, url };
}
