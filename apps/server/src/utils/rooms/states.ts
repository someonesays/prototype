import type { WSState } from "../types/rooms";

export function isNotHost(state: WSState) {
  return state.serverRoom.room.host !== state.user.id;
}

export function isLoadedOrLoading(state: WSState) {
  return state.serverRoom.loaded || state.serverRoom.loading;
}

export function isNotLoaded(state: WSState) {
  return !state.serverRoom.loaded;
}

export function isReady(state: WSState) {
  return state.user.ready;
}

export function isNotUserOrHost(state: WSState, user: string) {
  return user !== state.user.id && (isNotHost(state) || !state.serverRoom.players.get(user)?.ready);
}

export function isNotUserWithStatePermissionOrHost(state: WSState, user: string) {
  return (isNotHost(state) || !state.serverRoom.players.get(user)?.ready) && user !== state.user.id;
}
