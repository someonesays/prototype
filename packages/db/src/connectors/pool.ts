import env from "@/env";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import schema from "../main/schema";

export const pool = new pg.Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
});

export const db = drizzle(pool, { schema });
