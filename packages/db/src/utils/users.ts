import schema from "../main/schema";
import { eq } from "drizzle-orm";
import { db } from "../connectors/pool";
import { NOW } from "./utils";
import type { User } from "@/public";

export async function createUser(user: typeof schema.users.$inferInsert) {
  return (await db.insert(schema.users).values(user).returning({ id: schema.users.id }))[0].id;
}

export async function updateUser(user: Partial<typeof schema.users.$inferSelect> & { id: string }) {
  await db.update(schema.users).set(user).where(eq(schema.users.id, user.id));
}

export async function resetUserLastRevokedToken(id: string) {
  await db.update(schema.users).set({ lastRevokedToken: NOW }).where(eq(schema.users.id, id));
}

export async function deleteUser(id: string) {
  await db.delete(schema.users).where(eq(schema.users.id, id));
}

export function getUser(id: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
}

export function getUserByDiscordId(discordId: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.discordId, discordId),
  });
}

export async function getUserPublic(id: string) {
  const user = await getUser(id);
  if (!user) return null;
  return transformUserToUserPublic(user);
}

export function transformUserToUserPublic(user: typeof schema.users.$inferSelect): User {
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt.toString(),
  };
}
