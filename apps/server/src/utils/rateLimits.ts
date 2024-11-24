import env from "@/env";
import { RateLimiter } from "@/redis";

export const roomCreationRateLimit = new RateLimiter({
  keyspace: "room_creation",
  maximum: env.NODE_ENV !== "development" ? 2 : Infinity,
  interval: 10,
});
