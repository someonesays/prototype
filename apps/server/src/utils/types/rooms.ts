import type { GamePlayerPrivate, Minigame, Screens, State } from "@/sdk";
import type { WSContext } from "hono/ws";

export interface ServerPlayer extends GamePlayerPrivate {
  ws: WSContext;
  messageType: "Oppack" | "Json";
}

export interface ServerRoom {
  loading: boolean;
  loaded: boolean;
  started: boolean;
  room: {
    id: string;
    name: string;
    host: string;
    state: State;
  };
  screen: Screens;
  minigame: Minigame | null;
  players: Map<string, ServerPlayer>;
}

export interface WSState {
  messageType: string;
  user: ServerPlayer;
  serverRoom: ServerRoom;
}
