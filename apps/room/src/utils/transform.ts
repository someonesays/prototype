import type { GamePlayer } from "@/public";
import type { ServerPlayer } from "./types";

export function transformToGamePlayers(players: ServerPlayer[] | Map<string, ServerPlayer>): GamePlayer[] {
  return [...players.values()].map((p) => transformToGamePlayer(p));
}

export function transformToGamePlayer(player: ServerPlayer): GamePlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    avatar: player.avatar,
    mobile: player.mobile,
    points: player.points,
    ready: player.ready,
    state: player.state,
  };
}
