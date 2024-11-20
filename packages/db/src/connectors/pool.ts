import env from "@/env";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import schema from "../main/schema";

export const pool = new pg.Pool({
  host: env.DatabaseHost,
  port: env.DatabasePort,
  user: env.DatabaseUser,
  password: env.DatabasePassword,
  database: env.DatabaseName,
});

export const db = drizzle(pool, { schema });
