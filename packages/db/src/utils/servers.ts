import schema from "../main/schema";
import { and, asc, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "../connectors/pool";
import { MatchmakingLocation } from "@/public";

function validateServer(server: Partial<typeof schema.servers.$inferSelect>) {
  // Force the server ID to be 3 characters long
  if (server.id?.length !== 3) throw new Error("'id' must be 3 characters long");
  // Force the location to be part of the MatchmakingLocation enum
  if (server.location && !Object.values(MatchmakingLocation).includes(server.location))
    throw new Error("'location' must be a valid location in the MatchmakingLocation enum");
  // Disallow trailing slash on URLs
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
  if (server.wsDiscord)
    throw new Error("'wsDiscord' should not be modified or else it can break the matchmaking on Discord activites");

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

export function findBestServerByLocation(location: MatchmakingLocation) {
  return db.query.servers.findFirst({
    extras: {
      currentToMaxServersRatio:
        sql`cast(${schema.servers.currentRooms} as float) / cast(${schema.servers.maxRooms} as float)`.as(
          "current_to_max_servers_ratio",
        ),
    },
    where: and(
      isNotNull(schema.servers.ws),
      eq(schema.servers.location, location),
      lt(schema.servers.currentRooms, schema.servers.maxRooms),
    ),
    orderBy: asc(sql`current_to_max_servers_ratio`),
  }) as Promise<(typeof schema.servers.$inferSelect & { ws: string }) | undefined>;
}

export async function findBestServerByDiscordLaunchId(snowflake: bigint) {
  // What's the point of this?
  // - I didn't want to store the room IDs/instance IDs corresponding to the server IDs on the database
  // - This supports adding in servers anytime without breaking the algorithm to find which server to select

  // How this works:

  // I decided to use this basic formula: launch_id % max(index) == index
  // -> launch_id is the "snowflake" given from Discord's API - also happens to be a timestamp of when the activity started
  // -> max(index) is the total servers length that was created before the date given from the launch_id "snowflake"
  // -> index is the index of the server ordered by the server ID based on the servers created before the launch_id "snowflake"

  // It determines the server you get using 'launch_id % max(index)' and '== index' is used to get the correct row/server

  // This will break if servers are deleted when people are still in them
  // Servers must be properly shut down, have maxRooms = 0, currentRoom = 0 and removed from the database in order to be deleted
  // Additionally, MAKE SURE EVERY ROOM CREATED BY THE DISCORD ACTIVITY MADE BEFORE the latest launch_id IS DESTROYED.
  // When in doubt, don't delete servers.

  // This will also break if you change the value of 'ws_discord' from NULL to a string or vice-versa so don't change this value
  // If I want to change this value from NULL to a string or vice-versa, create a completely new server and shut the old one down

  const server = (
    await db
      .select({
        // Select all the values from the .from(...)
        id: sql`id`,
        location: sql`location`,
        url: sql`url`,
        ws: sql`ws`,
        wsDiscord: sql`ws_discord`,
        currentRooms: sql`current_rooms`,
        maxRooms: sql`max_rooms`,
        createdAt: sql`created_at`,
      })
      .from(
        // Add an 'index' to each row while only selecting servers created before the created_at date
        sql`(select *, cast(row_number() over (order by id) as int) - 1 as index, cast(count(*) over (partition by id) as int) as max_index from ${schema.servers} where ws_discord is not null and created_at < ${convertSnowflakeToDate(snowflake)}) as indexed_servers`,
      )
      .where(
        and(
          // Checks if the room is full
          lt(sql`current_rooms`, sql`max_rooms`),
          // snowflake % max(index) == index
          eq(sql`mod(cast(${snowflake} as bigint), max_index)`, sql`index`),
        ),
      )
  )[0] as (typeof schema.servers.$inferSelect & { wsDiscord: string }) | undefined;
  if (!server) return undefined;

  server.createdAt = new Date(server.createdAt);
  return server;
}

export function convertSnowflakeToDate(snowflake: bigint) {
  const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
  return new Date(dateBits + 1420070400000);
}
