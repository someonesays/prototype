import { MinigameType, Visibility, MinigamePermissions } from "@/public";

export const minigames = [
  {
    id: "1",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    author: {
      name: "Someone",
    },
    urlType: MinigameType.WholePath,
    urlHost: "localhost:5173",
    urlSecure: false,
    flagsAllowModifyingSelfUserState: true,
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
    urlType: MinigameType.Original,
    urlHost: "example.com",
    urlSecure: true,
    flagsAllowModifyingSelfUserState: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
