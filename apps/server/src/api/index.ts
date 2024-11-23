import { Hono } from "hono";
import { MessageCodes } from "@/public";

import { auth } from "./auth";
import { minigames } from "./minigames";
import { packs } from "./packs";
import { matchmaking } from "./matchmaking";

export const api = new Hono();

api.route("/auth", auth);
api.route("/minigames", minigames);
api.route("/packs", packs);
api.route("/matchmaking", matchmaking);

api.get("/", (c) => c.json({ code: MessageCodes.HelloWorld }));
api.get("/*", (c) => c.json({ code: MessageCodes.NotFound }, 404));
