// String.fromCharCode(x) can be values from 0-127
// 128 * 128 = 16384 maximum possible servers the room ID system can support

export function encodeRoomId({ serverId, serverRoomId }: { serverId: number; serverRoomId: string }) {
  return Buffer.from(
    `${String.fromCharCode(Math.floor(serverId / 128)) + String.fromCharCode(serverId % 128)}${serverRoomId}`,
  ).toString("base64");
}

export function decodeRoomId(hashed: string) {
  const decoded = Buffer.from(hashed, "base64").toString("utf-8");

  const decodedServerId = decoded.slice(0, 2);
  if (decodedServerId.length !== 2) return null;

  const serverId = decodedServerId.charCodeAt(0) * 128 + decodedServerId.charCodeAt(1);
  if (serverId < 0 || serverId > 16384) return null;

  const serverRoomId = decoded.slice(2);
  if (serverRoomId.length !== 4) return null;

  return { serverId, serverRoomId };
}
