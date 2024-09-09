import { prompts } from "./prompts";
import { Visibility } from "@/public";

export function getPrompts({
  visibility = [Visibility.Private, Visibility.Public],
}: { visibility: Visibility[] }) {
  return prompts.find((p) => visibility.includes(p.visibility));
}

export function getPrompt(id: string) {
  return prompts.find((p) => p.id === id);
}

export function getRandomPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}
