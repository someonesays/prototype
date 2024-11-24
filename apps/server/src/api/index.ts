import { Hono } from "hono";
import { MessageCodes } from "@/public";

import { auth } from "./auth";
import { users } from "./users";

import { minigames } from "./minigames";
import { packs } from "./packs";
import { matchmaking } from "./matchmaking";

export const api = new Hono();

api.route("/auth", auth);
api.route("/users", users);

api.route("/minigames", minigames);
api.route("/packs", packs);
api.route("/matchmaking", matchmaking);

api.get("/", (c) => c.json({ code: MessageCodes.HELLO_WORLD }));
api.get("/*", (c) => c.json({ code: MessageCodes.NOT_FOUND }, 404));
