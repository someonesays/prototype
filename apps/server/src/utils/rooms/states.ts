import type { WSState } from "../types/rooms";

export function isNotHost(state: WSState) {
  return state.serverRoom.room.host !== state.user.id;
}

export function isStartedOrStarting(state: WSState) {
  return state.serverRoom.started || state.serverRoom.starting;
}

export function isNotStarted(state: WSState) {
  return !state.serverRoom.started;
}

export function isReady(state: WSState) {
  return state.user.ready;
}

export function isNotUserOrHost(state: WSState, user: string) {
  return user !== state.user.id && (isNotHost(state) || !state.serverRoom.players.get(user)?.ready);
}

export function isNotUserWithStatePermissionOrHost(state: WSState, user: string) {
  return (
    (isNotHost(state) || !state.serverRoom.players.get(user)?.ready) &&
    (!state.serverRoom.minigame?.flags.allowModifyingSelfUserState || user !== state.user.id)
  );
}
