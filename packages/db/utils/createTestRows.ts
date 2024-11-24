import { MatchmakingLocation, MinigamePathType, MinigamePublishType, PackPublishType } from "@/public";
import { addMinigameToPack, createMinigame, createPack, createServer, createUser } from "../src/utils";

const authorId = await createUser({ name: "Two" });

const minigameId = await createMinigame({
  id: "whwj9rs8vvd6alyznh",
  name: "Click the buttons",
  authorId,
  description: "The objective of this game is to click the buttons.",
  previewImage: null,
  publishType: MinigamePublishType.PUBLIC_OFFICIAL,
  prompt: "Someone says **click the buttons**",
  termsOfServices: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  privacyPolicy: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  proxyUrl: "http://localhost:5173",
  pathType: MinigamePathType.WHOLE_PATH,
  minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
});

const packId = await createPack({
  id: "aq23ndwgztlt16vjwz",
  authorId,
  name: "Example pack name",
  description: "This is the pack's description.",
  iconImage: null,
  publishType: PackPublishType.PUBLIC,
});

await addMinigameToPack({ packId, minigameId });

await createServer({
  id: "000",
  location: MatchmakingLocation.USA,
  url: "http://localhost:3002",
  ws: "ws://localhost:3002/api/rooms",
  wsDiscord: "/.proxy/api/rooms/000",
  maxRooms: 100,
});

process.exit();
