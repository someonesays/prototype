import { redis } from "./redis";

export class RateLimiter {
  /** THe keyspace placed in front of every key */
  private keyspace: string;
  /** The maximum requests per interval */
  private maximum: number;
  /** The interval of the rate limit in seconds */
  private interval: number;

  /**
   * Create a rate limiter class
   * @param data The keyspace, maximum and interval value
   */
  constructor({ keyspace, maximum, interval }: { keyspace: string; maximum: number; interval: number }) {
    this.keyspace = keyspace;
    this.maximum = maximum;
    this.interval = interval;
  }

  /**
   * Check the key's rate limit and add to the counter
   * @param key The key
   * @returns A boolean representing if the user passed the rate limit or not
   */
  async check(key: string) {
    const fullKey = `${this.keyspace}:${key}`;
    const value = (await redis.multi().incr(fullKey).expire(fullKey, this.interval, "NX").exec()) as [
      [null, number],
      [null, number],
    ];
    return value[0][1] <= this.maximum;
  }
}
