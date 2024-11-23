export default {
  // Global
  NodeEnv: process.env.NODE_ENV as "production" | "staging" | "development",

  Port: Number(process.env.PORT),

  BaseFrontend: process.env.FRONTEND_URL as string,

  RoomAuthorization: process.env.ROOMS_AUTHORIZATION as string,
  RoomJwtSecret: process.env.ROOM_JWT_SECRET as string,

  DatabaseHost: process.env.DATABASE_HOST as string,
  DatabasePort: Number(process.env.DATABASE_PORT),
  DatabaseUser: process.env.DATABASE_USER as string,
  DatabasePassword: process.env.DATABASE_PASSWORD as string,
  DatabaseName: process.env.DATABASE_NAME as string,
  DatabaseSsl: process.env.DATABASE_SSL?.toLowerCase() === "true",

  // Server-only
  BaseApi: process.env.BASE_API || "",

  Clusters: process.env.CLUSTERS?.toLowerCase() === "auto" ? navigator.hardwareConcurrency : Number(process.env.CLUSTERS),

  CuidFingerprint: process.env.CUID_FINGERPRINT as string,

  turnstileSecretKeyInvisible: process.env.TURNSTILE_SECRET_KEY_INVISIBLE as string,
  turnstileSecretKeyManaged: process.env.TURNSTILE_SECRET_KEY_MANAGED as string,

  DiscordClientId: process.env.DISCORD_CLIENT_ID as string,
  DiscordClientSecret: process.env.DISCORD_CLIENT_SECRET as string,
  DiscordToken: process.env.DISCORD_TOKEN as string,

  RedisPort: Number(process.env.REDIS_PORT || "6379"),
  RedisHost: process.env.REDIS_HOST ?? "127.0.0.1",
  RedisUsername: process.env.REDIS_USERNAME,
  RedisPassword: process.env.REDIS_PASSWORD,
  RedisDatabase: Number(process.env.REDIS_DB ?? "0"),

  // Room-only
  ServerId: process.env.SERVER_ID as string,

  AllowedWsOrigins: process.env.ALLOWED_WS_ORIGINS?.split(",").map((o) => o.trim()) || [],
};
