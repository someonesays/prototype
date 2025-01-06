import { Hono } from "hono";
import { ErrorMessageCodes } from "@/public";

import { admin } from "./admin";
import { auth } from "./auth";
import { users } from "./users";
import { minigames } from "./minigames";
import { matchmaking } from "./matchmaking";

export const api = new Hono();

api.route("/admin", admin);
api.route("/auth", auth);
api.route("/users", users);
api.route("/minigames", minigames);
api.route("/matchmaking", matchmaking);

api.get("/", (c) => c.json({ hello: "world" }));
api.get("/*", (c) => c.json({ code: ErrorMessageCodes.NOT_FOUND }, 404));
