import { MinigamePathType, MinigameVisibility } from "@/public";

export const minigames = [
  {
    id: "1",
    name: "Click the buttons",
    description: "The objective of this game is to click the buttons.",
    previewImage: null,
    previewPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
    visibility: MinigameVisibility.Public,
    prompt: "Someone says **click the buttons**",
    legalTermsUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    legalPrivacyUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: {
      name: "Someone",
    },
    proxyUrl: "http://localhost:5173",
    pathType: MinigamePathType.WholePath,
    minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
    reportable: false, // official minigames shouldn't be reportable
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
    prompt: "Someone says **kill yourself**",
    legalTermsUrl: null,
    legalPrivacyUrl: null,
    author: {
      name: "Nobody",
    },
    proxyUrl: "https://example.com",
    pathType: MinigamePathType.Original,
    minimumPlayersToStart: 1,
    reportable: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
