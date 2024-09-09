import { Hono } from "hono";
import { MessageCodes } from "../../../../../packages/public/src";
import { getPrompt } from "@/db";

export const prompts = new Hono();

prompts.get("/:id", async (c) => {
  const id = c.req.param("id");

  const prompt = await getPrompt(id);
  if (!prompt) return c.json({ code: MessageCodes.NotFound }, 404);

  return c.json({
    id: prompt.id,
    visibility: prompt.visibility,
    prompt: prompt.prompt,
    author: {
      name: prompt.author.name,
    },
    url: `/api/proxy/${prompt.id}/`,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  });
});
