import env from "@/env";
import { RateLimiter } from "@/redis";

export const roomCreationRateLimit = new RateLimiter({
  keyspace: "room_creation",
  maximum: env.NODE_ENV !== "development" ? 2 : Infinity,
  interval: 10,
});

export const minigameCreationLimit = new RateLimiter({
  keyspace: "minigame_creation",
  maximum: env.NODE_ENV !== "development" ? 1 : Infinity,
  interval: 10,
});

export const minigameAccessCodeResetLimit = new RateLimiter({
  keyspace: "minigame_access_code_reset",
  maximum: env.NODE_ENV !== "development" ? 1 : Infinity,
  interval: 5,
});

export const packCreationLimit = new RateLimiter({
  keyspace: "pack_creation",
  maximum: env.NODE_ENV !== "development" ? 1 : Infinity,
  interval: 10,
});
