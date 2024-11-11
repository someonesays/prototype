import { MinigamePathType, MinigameVisibility } from "@/public";

export const minigames = [
  {
    id: "1",
    visibility: MinigameVisibility.Public,
    prompt: "click the buttons",
    author: {
      name: "Someone",
    },
    urlHost: "localhost:5173",
    urlSecure: false,
    pathType: MinigamePathType.WholePath,
    minimumPlayersToStart: 2, // (there's nothing stopping a player from leaving after a game starts)
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    visibility: MinigameVisibility.Public,
    prompt: "kill yourself",
    author: {
      name: "Nobody",
    },
    urlHost: "example.com",
    urlSecure: true,
    pathType: MinigamePathType.Original,
    minimumPlayersToStart: 1,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
