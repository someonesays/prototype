import { MinigameEndReason, GameStatus, ServerOpcodes } from "@/public";
import { broadcastMessage } from "./messages";
import { transformToGamePlayers } from "./transform";
import type { ServerRoom, WSState } from "./types";

export function isHost(state: WSState) {
  return state.serverRoom.room.host === state.user.id;
}

export function isLobby(state: WSState) {
  return state.serverRoom.status === GameStatus.LOBBY;
}

export function isStarted(state: WSState) {
  return state.serverRoom.status === GameStatus.STARTED;
}

export function isReady(state: WSState) {
  return state.user.ready;
}

export function isNotUser(state: WSState, user: string) {
  return user !== state.user.id;
}

export function isNotUserOrHost(state: WSState, user: string) {
  return isNotUser(state, user) && (!isHost(state) || !state.serverRoom.players.get(user)?.ready);
}

export function isUserReady(state: WSState, user: string) {
  return !!state.serverRoom.players.get(user)?.ready;
}

export function startGame(room: ServerRoom) {
  // Set room status to started
  room.status = GameStatus.STARTED;

  // Remove ready timer
  removeReadyTimerGame(room);

  // Broadcast minigame started
  return broadcastMessage({
    room,
    opcode: ServerOpcodes.MINIGAME_START_GAME,
    data: {},
  });
}

export function endGame(
  opts:
    | {
        room: ServerRoom;
        reason:
          | MinigameEndReason.FORCEFUL_END
          | MinigameEndReason.HOST_LEFT
          | MinigameEndReason.FAILED_TO_SATISFY_MINIMUM_PLAYERS_TO_START;
      }
    | { room: ServerRoom; reason: MinigameEndReason.MINIGAME_ENDED },
) {
  // Set room state to lobby
  opts.room.status = GameStatus.LOBBY;

  // Remove ready timer
  removeReadyTimerGame(opts.room);

  // Unreadies everyone and resets their user states
  unreadyPlayersGame(opts.room);

  // Reset states
  opts.room.room.state = null;

  // Broadcast minigame ended
  broadcastMessage({
    room: opts.room,
    opcode: ServerOpcodes.END_MINIGAME,
    data:
      opts.reason === MinigameEndReason.MINIGAME_ENDED
        ? {
            players: transformToGamePlayers(opts.room.players),
            reason: opts.reason,
          }
        : {
            players: transformToGamePlayers(opts.room.players),
            reason: opts.reason,
          },
  });
}

export function removeReadyTimerGame(room: ServerRoom) {
  if (room.readyTimer) {
    clearTimeout(room.readyTimer);
    room.readyTimer = undefined;
  }
}

export function unreadyPlayersGame(room: ServerRoom) {
  for (const player of room.players.values()) {
    player.ready = false;
    player.state = null;
  }
}
