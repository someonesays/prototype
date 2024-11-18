import { createCode } from "./random";

export function encodeRoomId(serverId: string) {
  // Check if the parameters are valid
  if (serverId.length !== 3) throw new Error("The server ID's length must be 3");
  // Return unordered hash/room ID
  return serverId + createCode(7);
}

export function decodeRoomId(roomId: string) {
  // Check if the parameters are valid
  if (roomId.length !== 10) return null;
  // Return server ID
  return roomId.slice(0, 3);
}
