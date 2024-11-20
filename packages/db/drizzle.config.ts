import env from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/**/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: env.DatabaseHost,
    port: env.DatabasePort,
    user: env.DatabaseUser,
    password: env.DatabasePassword,
    database: env.DatabaseName,
    ssl: env.DatabaseSsl,
  },
});
