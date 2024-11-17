import { MinigamePathType, MinigameVisibility } from "@/public";

export const minigames = [
  {
    id: "1",
    name: "Click the buttons",
    description: "The objective of this game is to click the buttons.",
    previewImage: null,
    previewPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
    visibility: MinigameVisibility.Public,
    prompt: "click the buttons",
    author: {
      name: "Someone",
    },
    urlHost: "localhost:5173",
    urlSecure: false,
    pathType: MinigamePathType.WholePath,
    minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
  {
    id: "2",
    name: "Example minigame",
    description: "This is an example minigame.",
    previewImage: null,
    previewPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
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
