export default {
  NodeEnv: process.env.NODE_ENV as "production" | "development",

  Port: Number(process.env.PORT),

  FrontendUrl: process.env.FRONTEND_URL as string,

  VitePort: Number(process.env.VITE_PORT),
  ViteBaseApi: process.env.VITE_BASE_API as string,

  RoomAuthorization: process.env.ROOMS_AUTHORIZATION as string,
  ServerId: Number(process.env.SERVER_ID),
  MaxRooms: Number(process.env.MAX_ROOMS),

  AllowedWsOrigins: process.env.ALLOWED_WS_ORIGINS?.split(",").map((o) => o.trim()) || [],

  JWTSecret: process.env.JWT_SECRET as string,
  JWTAlgorithm: process.env.JWT_ALGORITHM as "HS256" | "RS256",

  CuidFingerprint: process.env.CUID_FINGERPRINT as string,
};
