import { Hono } from "hono";

import { websocket } from "./rooms/websocket";
import { state } from "./rooms/state";

export const api = new Hono();

api.route("/rooms/ws", websocket);
api.route("/rooms", state);
