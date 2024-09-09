import { PromptType, Visibility } from "@/public";

export const prompts = [
  {
    id: "1",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    urlType: PromptType.WholePath,
    urlHost: "localhost:5173",
    urlSecure: false,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    visibility: Visibility.Public,
    prompt: "kill youself",
    urlType: PromptType.Original,
    urlHost: "example.com",
    urlSecure: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
