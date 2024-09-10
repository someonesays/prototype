import env from "@/env";
import { getPrompt } from "@/db";
import { PromptType } from "@/public";
import { Hono, type Context } from "hono";
import { NONCE, secureHeaders } from "hono/secure-headers";
import type { BlankEnv } from "hono/types";

export const proxy = new Hono();

const route = "/api/proxy/:promptId/*";
const devHeaders = env.NodeEnv === "production" ? [] : [`http://localhost:${env.VitePort}`];

proxy.use(route, async (c, next) => {
  const { proxyHref } = await getProxy(c);
  return secureHeaders({
    originAgentCluster: "",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [...devHeaders, proxyHref, "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [...devHeaders, proxyHref],
      childSrc: [...devHeaders, proxyHref, "blob:"],
      workerSrc: [...devHeaders, proxyHref, "blob:"],
    },
    xFrameOptions: "SAMEORIGIN",
    crossOriginResourcePolicy: "same-site",
  })(c, next);
});

proxy.get(route, async (c) => {
  const { url } = await getProxy(c);
  try {
    const res = await fetch(url, {
      method: c.req.method,
      headers: { "user-agent": "Someone Says" },
    });

    if (![200, 404].includes(res.status)) {
      return c.text("Returned a status other than 200 and 404", 400);
    }

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

  const href = `${http}://${prompt.urlHost}`;
  const proxyHref = `${env.Domain}/api/proxy/${prompt.id}/`;

  const url = `${href}${path}${query}`;
  // const proxyUrl = `${proxyHref}${path}${query}`;

  return { proxyHref, url };
}
