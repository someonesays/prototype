import { MatchmakingLocation, MinigamePathType } from "@/public";
import { createMinigame, createServer, createUser } from "../src/utils";

const authorId = await createUser({ name: "Two", discordId: "276497792526974996" });

await createMinigame({
  id: "whwj9rs8vvd6alyznh",
  name: "Click the buttons",
  authorId,
  description: "The objective of this game is to click the buttons.",
  previewImage: "https://upload.wikimedia.org/wikipedia/commons/e/e0/PlaceholderLC.png",
  published: true,
  official: true,
  termsOfServices: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  privacyPolicy: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  proxyUrl: "http://localhost:5173",
  pathType: MinigamePathType.WHOLE_PATH,
  testingAccessCode: "verysecretaccesstoken",
  minimumPlayersToStart: 1, // (there's nothing stopping a player from leaving AFTER a game starts)
  supportsMobile: true,
});

await createServer({
  id: "000",
  location: MatchmakingLocation.USA,
  url: "http://localhost:3002",
  ws: "ws://localhost:3002/api/rooms",
  wsTesting: "ws://localhost:3002/api/rooms",
  wsDiscord: "/.proxy/api/rooms/000",
  maxRooms: 100,
});

process.exit();
