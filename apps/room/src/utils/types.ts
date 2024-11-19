import type { GamePlayer, GameStatus, Minigame, Pack, State } from "@/public";
import type { WSContext } from "hono/ws";

export interface ServerPlayer extends GamePlayer {
  ws: WSContext;
  messageType: "Oppack" | "Json";
}

export interface ServerRoom {
  status: GameStatus;
  room: {
    id: string;
    host: string;
    state: State;
  };
  pack: Pack | null;
  minigame: Minigame | null;
  players: Map<string, ServerPlayer>;
  readyTimer?: Timer;
}

export interface WSState {
  messageType: string;
  user: ServerPlayer;
  serverRoom: ServerRoom;
}
