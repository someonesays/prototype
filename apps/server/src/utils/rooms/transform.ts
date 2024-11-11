import type { GamePlayer } from "@/sdk";
import type { ServerPlayer } from "../types/rooms";

export function transformToGamePlayers(players: ServerPlayer[] | Map<string, ServerPlayer>): GamePlayer[] {
  return [...players.values()].map((p) => transformToGamePlayer(p));
}

export function transformToGamePlayer(player: ServerPlayer): GamePlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    points: player.points,
    ready: player.ready,
    state: player.state,
  };
}
