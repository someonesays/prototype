export default {
  NodeEnv: process.env.NODE_ENV as "production" | "development",

  Domain: process.env.DOMAIN as string,
  Websocket: process.env.WEBSOCKET as string,

  AllowedWsOrigins: (process.env.ALLOWED_WS_ORIGINS as string).split(",").map((o) => o.trim()),

  Port: Number(process.env.PORT),
  VitePort: Number(process.env.VITE_PORT),

  JWTSecret: process.env.JWT_SECRET as string,
  JWTAlgorithm: process.env.JWT_ALGORITHM as "HS256" | "RS256",

  CuidFingerprint: process.env.CUID_FINGERPRINT as string,
};
