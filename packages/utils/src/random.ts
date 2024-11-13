import env from "@/env";
import { getRandomValues } from "node:crypto";
import { init, isCuid } from "@paralleldrive/cuid2";

/**
 * Create a CUID.
 * @returns The CUID.
 */
const createCuid = init({
  random: Math.random,
  length: 18,
  fingerprint: env.CuidFingerprint,
});

/**
 * Generate a randomly generated code
 * @param length The length of the randomly generated code
 * @returns The randomly generated code
 */
function createCode(length: number) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint32Array(length);
  let result = "";
  getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

export { isCuid, createCuid, createCode };
