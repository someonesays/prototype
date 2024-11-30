export default {
  // Global
  NODE_ENV: process.env.NODE_ENV as "production" | "staging" | "development",

  PORT: Number(process.env.PORT),

  BASE_FRONTEND: process.env.BASE_FRONTEND as string,

  JWT_SECRET: process.env.JWT_SECRET as string,

  ROOMS_AUTHORIZATION: process.env.ROOMS_AUTHORIZATION as string,

  DATABASE_HOST: process.env.DATABASE_HOST as string,
  DATABASE_PORT: Number(process.env.DATABASE_PORT),
  DATABASE_USER: process.env.DATABASE_USER as string,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD as string,
  DATABASE_NAME: process.env.DATABASE_NAME as string,
  DATABASE_SSL: process.env.DATABASE_SSL?.toLowerCase() === "true",

  // Server-only
  BASE_API: process.env.BASE_API || "",

  CLUSTERS: process.env.CLUSTERS?.toLowerCase() === "auto" ? navigator.hardwareConcurrency : Number(process.env.CLUSTERS),

  CUID_FINGERPRINT: process.env.CUID_FINGERPRINT as string,

  COOKIE_SIGNATURE: process.env.COOKIE_SIGNATURE as string,

  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY as string,
  TURNSTILE_BYPASS_SECRET: process.env.TURNSTILE_BYPASS_SECRET,

  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID as string,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET as string,
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI as string,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN as string,

  REDIS_PORT: Number(process.env.REDIS_PORT || "6379"),
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: Number(process.env.REDIS_DB ?? "0"),

  // Room-only
  SERVER_ID: process.env.SERVER_ID as string,

  ALLOWED_WS_ORIGINS: process.env.ALLOWED_WS_ORIGINS?.split(",").map((o) => o.trim()) || [],
};
