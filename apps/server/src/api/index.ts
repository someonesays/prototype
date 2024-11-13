import { Hono } from "hono";
import { MessageCodes } from "@/public";

import { minigames } from "./minigames";
import { packs } from "./packs";
import { matchmaking } from "./matchmaking";
import { rooms } from "./rooms";

export const api = new Hono();

api.route("/minigames", minigames);
api.route("/packs", packs);
api.route("/matchmaking", matchmaking);
api.route("/rooms", rooms);

api.get("/", (c) => c.json({ code: MessageCodes.HelloWorld }));
api.get("/*", (c) => c.json({ code: MessageCodes.NotFound }, 404));
