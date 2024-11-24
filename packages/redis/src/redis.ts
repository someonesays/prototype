import env from "@/env";
import Redis from "ioredis";

export const redis = new Redis({
  port: env.REDIS_PORT,
  host: env.REDIS_HOST,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  enableOfflineQueue: true,
});

redis.on("error", (err) => {
  console.error(err);
});
