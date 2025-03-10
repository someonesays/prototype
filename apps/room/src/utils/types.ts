import type { GamePlayer, GameStatus, Minigame, State } from "@/public";
import type { WSContext } from "hono/ws";

export interface ServerPlayer extends GamePlayer {
  matchmakingId: string;
  ws: WSContext;
  messageType: "Oppack" | "Json";
}

export interface ServerRoom {
  status: GameStatus;
  room: {
    id: string;
    host: number;
    state: State;
  };
  minigame: Minigame | null;
  players: Map<string, ServerPlayer>; // Map<MatchmakingId, ServerPlayer>
  readyTimer?: Timer;
  testingShutdown: boolean;
  roomHandshakeCount: number;
}

export interface WSState {
  messageType: string;
  user: ServerPlayer;
  serverRoom: ServerRoom;
}
