import { MinigameEndReason, GameStatus, ServerOpcodes, type GamePrize } from "@/public";
import { broadcastMessage } from "./messages";
import { transformToGamePlayers } from "./transform";
import type { ServerRoom, WSState } from "../types/rooms";

export function isNotHost(state: WSState) {
  return state.serverRoom.room.host !== state.user.id;
}

export function isLobby(state: WSState) {
  return state.serverRoom.status === GameStatus.Lobby;
}

export function isStarted(state: WSState) {
  return state.serverRoom.status === GameStatus.Started;
}

export function isReady(state: WSState) {
  return state.user.ready;
}

export function isNotUser(state: WSState, user: string) {
  return user !== state.user.id;
}

export function isNotUserOrHost(state: WSState, user: string) {
  return isNotUser(state, user) && (isNotHost(state) || !state.serverRoom.players.get(user)?.ready);
}

export function isUserReady(state: WSState, user: string) {
  return !!state.serverRoom.players.get(user)?.ready;
}

export function startGame(room: ServerRoom) {
  // Set room status to started
  room.status = GameStatus.Started;

  // Remove ready timer
  removeReadyTimerGame(room);

  // Broadcast minigame started
  return broadcastMessage({
    room,
    opcode: ServerOpcodes.MinigameStartGame,
    data: {},
  });
}

export function endGame(
  opts:
    | {
        room: ServerRoom;
        reason:
          | MinigameEndReason.ForcefulEnd
          | MinigameEndReason.HostLeft
          | MinigameEndReason.FailedToSatisfyMinimumPlayersToStart;
      }
    | { room: ServerRoom; reason: MinigameEndReason.MinigameEnded; prizes: GamePrize[] },
) {
  // Set room state to lobby
  opts.room.status = GameStatus.Lobby;

  // Remove ready timer
  removeReadyTimerGame(opts.room);

  // Unreadies everyone and resets their user states
  unreadyPlayersGame(opts.room);

  // Reset states
  opts.room.room.state = null;

  // Broadcast minigame ended
  broadcastMessage({
    room: opts.room,
    opcode: ServerOpcodes.EndMinigame,
    data:
      opts.reason === MinigameEndReason.MinigameEnded
        ? {
            players: transformToGamePlayers(opts.room.players),
            reason: opts.reason,
            prizes: opts.prizes,
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
