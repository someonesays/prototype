import schema from "../main/schema";
import { asc, eq, lt } from "drizzle-orm";
import { db } from "../connectors/pool";

function validateServer(server: Partial<typeof schema.servers.$inferSelect>) {
  // Disallow trailing slash
  if (server.url?.endsWith("/")) throw new Error("'url' should not have a trailing slash");
  if (server.ws?.endsWith("/")) throw new Error("'ws' should not have a trailing slash");
  if (server.wsDiscord?.endsWith("/")) throw new Error("'wsDiscord' should not have a trailing slash");
  // Force the WebSocket endpoint to be /api/rooms
  if (server.ws && !server.ws.endsWith("/api/rooms")) throw new Error("'ws' must end with /api/rooms");
}

export async function createServer(server: typeof schema.servers.$inferInsert) {
  validateServer(server);
  return (await db.insert(schema.servers).values(server).returning({ id: schema.servers.id }))[0].id;
}

export async function updateServer(server: Partial<typeof schema.servers.$inferSelect> & { id: string }) {
  validateServer(server);
  await db.update(schema.servers).set(server).where(eq(schema.servers.id, server.id));
}

export async function deleteServer(id: string) {
  await db.delete(schema.servers).where(eq(schema.servers.id, id));
}

export function getServerById(id: string) {
  return db.query.servers.findFirst({
    where: eq(schema.servers.id, id),
  });
}

export function findBestServer() {
  return db.query.servers.findFirst({
    where: lt(schema.servers.currentRooms, schema.servers.maxRooms),
    orderBy: asc(schema.servers.currentRooms),
  });
}
