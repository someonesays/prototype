import type { ServerRoom } from "./types";

export const gameRooms = new Map<string, ServerRoom>();

setInterval(() => {
  for (const player of [...gameRooms.values()].flatMap((r) => [...r.players.values()])) {
    if (performance.now() > player.lastPing + 30000) {
      player.ws.close();
    }
  }
}, 30000);
