import { MinigamePathType, MinigameVisibility, PackVisibility } from "@/public";
import { addMinigameToPack, createMinigame, createPack, createUser } from "../src/utils";

const authorId = await createUser({ name: "Two" });

const minigameId = await createMinigame({
  name: "Click the buttons",
  authorId,
  description: "The objective of this game is to click the buttons.",
  previewImage: null,
  previewPlaceholderImage: null,
  visibility: MinigameVisibility.Public,
  prompt: "Someone says **click the buttons**",
  legalTermsUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  legalPrivacyUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  proxyUrl: "http://localhost:5173",
  pathType: MinigamePathType.WholePath,
  minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
});

const packId = await createPack({
  authorId,
  name: "Example pack name",
  description: "This is the pack's description.",
  iconImage: null,
  iconPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
  visibility: PackVisibility.Public,
});

await addMinigameToPack({ packId, minigameId });
