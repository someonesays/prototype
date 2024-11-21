import schema from "../main/schema";
import { and, asc, eq, lt, sql } from "drizzle-orm";
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
  // The server should only be deleted if there's nobody in the room and the server is down
  await db.delete(schema.servers).where(and(eq(schema.servers.id, id), eq(schema.servers.currentRooms, 0)));
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

export async function findBestServerDiscord(snowflake: bigint) {
  // What's the point of this?
  // - I didn't want to store the room IDs/instance IDs corresponding to the server IDs on the database
  // - This supports adding in servers anytime without breaking the algorithm to find which server to select.

  // How this works:

  // I decided to use this basic formula: launch_id % max(index) == index
  // -> launch_id is the "snowflake" given from Discord's API - also happens to be a timestamp of when the activity started
  // -> max(index) is the total servers length that was created before the date given from the launch_id "snowflake"
  // -> index is the index of the server ordered by the server ID based on the servers created before the launch_id "snowflake"

  // It determines the server you get using 'launch_id % max(index)' and '== index' is used to get the correct row/server

  // This will break if servers are deleted when people are still in them.
  // Servers must be properly shut down, have a currentRoom = 0 and removed from the database in order to be deleted.

  const server = (
    await db
      .select({
        // Select all the values from the .from(...)
        id: sql`id`,
        url: sql`url`,
        ws: sql`ws`,
        wsDiscord: sql`ws_discord`,
        currentRooms: sql`current_rooms`,
        maxRooms: sql`max_rooms`,
        createdAt: sql`created_at`,
      })
      .from(
        // Add an 'index' to each row while only selecting servers created before the created_at date
        sql`(select *, cast(row_number() over (order by id) as int) - 1 as index, cast(count(*) over (partition by id) as int) + 1 as total_index from ${schema.servers} where created_at < ${convertSnowflakeToDate(snowflake)}) as indexed_servers`,
      )
      .where(
        and(
          // Checks if the room is full
          lt(sql`current_rooms`, sql`max_rooms`),
          // snowflake % max(index) == index
          eq(sql`mod(cast(${snowflake} as bigint), total_index)`, sql`index`),
        ),
      )
  )[0] as typeof schema.servers.$inferSelect | undefined;
  if (!server) return undefined;

  server.createdAt = new Date(server.createdAt);
  return server;
}

export function convertSnowflakeToDate(snowflake: bigint) {
  const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
  return new Date(dateBits + 1420070400000);
}
