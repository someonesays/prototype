import { PromptType, Visibility } from "@/public";

export const prompts = [
  {
    id: "1",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    author: {
      name: "Someone",
    },
    urlType: PromptType.WholePath,
    urlHost: "localhost:5173",
    urlSecure: false,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    visibility: Visibility.Public,
    prompt: "kill yourself",
    author: {
      name: "Nobody",
    },
    urlType: PromptType.Original,
    urlHost: "example.com",
    urlSecure: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
