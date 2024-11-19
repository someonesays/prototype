export default {
  // Global
  NodeEnv: process.env.NODE_ENV as "production" | "development",

  Port: Number(process.env.PORT),

  BaseFrontend: process.env.FRONTEND_URL as string,

  RoomAuthorization: process.env.ROOMS_AUTHORIZATION as string,
  RoomJwtSecret: process.env.ROOM_JWT_SECRET as string,

  // Room-only
  ServerId: process.env.SERVER_ID as string,
  MaxRooms: Number(process.env.MAX_ROOMS),

  AllowedWsOrigins: process.env.ALLOWED_WS_ORIGINS?.split(",").map((o) => o.trim()) || [],

  // Server-only
  BaseApi: process.env.BASE_API || "",

  DiscordClientId: process.env.DISCORD_CLIENT_ID as string,
  DiscordClientSecret: process.env.DISCORD_CLIENT_SECRET as string,
  DiscordToken: process.env.DISCORD_TOKEN as string,

  CuidFingerprint: process.env.CUID_FINGERPRINT as string,
};
