import { MinigameType, Visibility } from "@/public";

export const minigames = [
  {
    id: "1",
    visibility: Visibility.Public,
    prompt: "click the buttons",
    minimumPlayersToStart: 2, // (there's nothing stopping a player from leaving after a game starts)
    author: {
      name: "Someone",
    },
    urlType: MinigameType.WholePath,
    urlHost: "localhost:5173",
    urlSecure: false,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    visibility: Visibility.Public,
    prompt: "kill yourself",
    minimumPlayersToStart: 1,
    author: {
      name: "Nobody",
    },
    urlType: MinigameType.Original,
    urlHost: "example.com",
    urlSecure: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
