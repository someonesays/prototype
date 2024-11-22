import { RateLimiter } from "@/redis";

export const roomCreationRateLimit = new RateLimiter({
  keyspace: "room_creation",
  maximum: 2,
  interval: 10,
});
