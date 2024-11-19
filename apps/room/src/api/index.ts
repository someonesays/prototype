import { Hono } from "hono";

import { websocket } from "./rooms/websocket";
import { state } from "./rooms/state";

export const api = new Hono();

api.route("/rooms", websocket);
api.route("/rooms", state);
