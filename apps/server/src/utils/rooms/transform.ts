import type { GamePlayerLeaderboards, GamePlayerPrivate } from "@/sdk";
import type { ServerPlayer } from "../types/rooms";

export function transformToGamePlayerPrivate(player: ServerPlayer): GamePlayerPrivate {
  return {
    id: player.id,
    displayName: player.displayName,
    ready: player.ready,
    state: player.state,
    points: player.points,
  };
}

export function transformToGamePlayerLeaderboards(player: ServerPlayer): GamePlayerLeaderboards {
  return {
    id: player.id,
    ready: false,
    points: player.points,
  };
}
