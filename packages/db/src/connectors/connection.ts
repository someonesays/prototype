import env from "@/env";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import schema from "../main/schema";

export const client = new pg.Client({
  host: env.DatabaseHost,
  port: env.DatabasePort,
  user: env.DatabaseUser,
  password: env.DatabasePassword,
  database: env.DatabaseName,
});

await client.connect();
export const db = drizzle(client, { schema });
