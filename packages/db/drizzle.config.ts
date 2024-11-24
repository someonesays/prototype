import env from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/**/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: env.DATABASE_SSL,
  },
});
