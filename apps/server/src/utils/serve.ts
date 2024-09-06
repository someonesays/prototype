// This file is a modified version of https://github.com/honojs/hono/blob/f9a23a9992979fed79b0703ab8b3a3ce49f7175f/src/adapter/bun/serve-static.ts#L10

import type { Context } from "hono";
import { serveStatic as baseServeStatic } from "hono/serve-static";
import type { ServeStaticOptions } from "hono/serve-static";
import type { Env, MiddlewareHandler } from "hono/types";
import { stat } from "node:fs/promises";

export const serve = <E extends Env = Env>(
  options: ServeStaticOptions<E> & { inject?: (c: Context, html: string) => string },
): MiddlewareHandler => {
  return async function serveStatic(c, next) {
    const getContent = async (path: string) => {
      const file = Bun.file(`./${path}`);
      if (!(await file.exists())) return null;
      if (file.type.startsWith("text/html;")) {
        const content = await file.text();
        return new Response(options.inject?.(c, content) || content, {
          headers: { "content-type": file.type },
        });
      }
      return file;
    };
    const pathResolve = (path: string) => `./${path}`;
    const isDir = async (path: string) => {
      try {
        const stats = await stat(path);
        return stats.isDirectory();
      } catch {}
    };
    return baseServeStatic({
      ...options,
      // @ts-ignore
      getContent,
      pathResolve,
      isDir,
    })(c, next);
  };
};
