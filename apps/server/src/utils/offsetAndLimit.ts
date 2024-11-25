import type { Context } from "hono";

export function getOffsetAndLimit(c: Context) {
  let offset = Number.parseInt(c.req.query("offset") || "0") || 0;
  let limit = Number.parseInt(c.req.query("limit") || "50") || 50;

  if (offset < 0) offset = 0;
  if (offset > Number.MAX_SAFE_INTEGER) offset = Number.MAX_SAFE_INTEGER;

  if (limit < 1) limit = 1;
  if (limit > 50) limit = 50;

  return { offset, limit };
}
