export default {
  // Global
  NodeEnv: process.env.NODE_ENV as "production" | "development",

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

  // Room-only
  ServerId: process.env.SERVER_ID as string,

  AllowedWsOrigins: process.env.ALLOWED_WS_ORIGINS?.split(",").map((o) => o.trim()) || [],

  // Server-only
  BaseApi: process.env.BASE_API || "",

  Clusters: process.env.CLUSTERS?.toLowerCase() === "auto" ? navigator.hardwareConcurrency : Number(process.env.CLUSTERS),

  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY as string,

  DiscordClientId: process.env.DISCORD_CLIENT_ID as string,
  DiscordClientSecret: process.env.DISCORD_CLIENT_SECRET as string,
  DiscordToken: process.env.DISCORD_TOKEN as string,

  CuidFingerprint: process.env.CUID_FINGERPRINT as string,
};
