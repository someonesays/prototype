import env from "@/env";
import { Hono, type Context } from "hono";
import { NONCE, secureHeaders } from "hono/secure-headers";
import type { BlankEnv } from "hono/types";

export const proxy = new Hono();

const route = "/:http{(http|https)}/:domain{^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$}/*";

proxy.use(route, (c, next) => {
  const { proxyUrl } = getProxyUrl(c);
  return secureHeaders({
    originAgentCluster: "",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", NONCE, "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "blob:"],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [proxyUrl, "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: [proxyUrl],
      childSrc: [proxyUrl, "blob:"],
      workerSrc: [proxyUrl, "blob:"],
    },
    xFrameOptions: "SAMEORIGIN",
  })(c, next);
});

proxy.get(route, async (c) => {
  const { url } = getProxyUrl(c);
  try {
    const res = await fetch(url, {
      method: c.req.method,
      headers: { "user-agent": "Someone Says" },
    });

    if (![200, 404].includes(res.status)) {
      return c.text("Returned a status other than 200 and 404", 400);
    }

    return new Response(res.body, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "",
      },
    });
  } catch (err) {
    return c.text("Cannot connect to URL", 404);
  }
});

function getProxyUrl(c: Context<BlankEnv, typeof route>) {
  const http = c.req.param("http");
  const domain = c.req.param("domain");
  const path = c.req.path.slice(c.req.param("http").length + domain.length + 12);
  const query = Object.entries(c.req.query()).length
    ? `?${new URLSearchParams(c.req.query())}`
    : "";
  const href = `${http}://${domain}/`;
  const url = `${http}://${domain}${path}${query}`;
  const proxyUrl = `${env.Domain}/${http}/${domain}`;

  return { http, domain, path, query, href, url, proxyUrl };
}
