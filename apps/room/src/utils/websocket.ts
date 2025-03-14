import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";
import type { Context, Env, Input } from "hono";
import type { WSContext, WSMessageReceive } from "hono/ws";

export const { upgradeWebSocket, websocket } = createBunWebSocket();

export interface WebSocketMiddlewareEvents {
  open?: (data: { evt: Event; ws: WSContext }) => void;
  message?: (data: {
    evt: MessageEvent<WSMessageReceive>;
    data: MessageEvent<WSMessageReceive>["data"];
    ws: WSContext;
  }) => void;
  close?: (data: { evt: CloseEvent; ws: WSContext }) => void;
  error?: (data: { evt: Event; ws: WSContext }) => void;
}

export function createWebSocketMiddleware<
  // biome-ignore lint/suspicious/noExplicitAny: This is how Hono does it
  E extends Env = any,
  P extends string = string,
  // biome-ignore lint/complexity/noBannedTypes: This is how Hono does it
  I extends Input = {},
>(middleware: (c: Context<E, P, I>) => Promise<WebSocketMiddlewareEvents | null | undefined>) {
  return createMiddleware(async (c, next) => {
    try {
      if (c.req.header("upgrade") !== "websocket") return await next();

      const events = await middleware(c);
      if (!events) return c.newResponse(null, { status: 500 });

      return upgradeWebSocket(() => ({
        onOpen: (evt, ws) => events.open?.({ evt, ws }),
        onMessage: (evt, ws) => events.message?.({ evt, data: evt.data, ws }),
        onClose: (evt, ws) => events.close?.({ evt, ws }),
        onError: (evt, ws) => events.error?.({ evt, ws }),
      }))(c, next);
    } catch (err) {
      console.error(err);
      return c.newResponse(null, 500);
    }
  });
}
