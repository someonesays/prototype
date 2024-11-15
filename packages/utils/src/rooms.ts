// String.fromCharCode(x) can be values from 0-127
// 128 * 128 = 16384 maximum possible servers the room ID system can support

export function encodeRoomId({ serverId, serverRoomId }: { serverId: number; serverRoomId: string }) {
  // Check if the parameters are valid
  if (serverId < 0 || serverId > 16384) throw new Error("The server ID should be a number between 0 and 16384");
  if (serverRoomId.length !== 4) throw new Error("The server room ID should be 4 characters long");

  // Get ordered hash
  const orderedHash = Buffer.from(
    `${String.fromCharCode(Math.floor(serverId / 128)) + String.fromCharCode(serverId % 128)}${serverRoomId}`,
  ).toString("base64");

  // Get hash for pseudo-randomness
  const seed = orderedHash.slice(-1);
  const seedChar = seed.charCodeAt(0);
  let value = orderedHash.slice(0, -1);

  // Reorder ID by second character
  const maxLength = (seedChar % 3) + 2;
  const savedValue = value;
  value = "";
  for (let i = 0; i < maxLength; i++) {
    for (let j = i; j < savedValue.length; j += maxLength) {
      value += savedValue[j];
    }
  }

  // Reverse the ID
  if (seedChar % 2) value = value.split("").reverse().join("");

  // Return unordered hash/room ID
  return seed + value;
}

export function decodeRoomId(hashed: string) {
  // Check if the input for unordered hash is valid
  if (hashed.length !== 8) return null;

  // Get seed to undo pseudo-randomness
  const seed = hashed.slice(0, 1);
  const seedChar = seed.charCodeAt(0);
  let value = hashed.slice(1);

  // Reverse it back to the original
  if (seedChar % 2) value = value.split("").reverse().join("");

  // Reverse the reorder by second character
  const maxLength = (seedChar % 3) + 2;
  const length = value.length;
  const originalValue = Array(length).fill(""); // Create an array to hold the original characters

  let index = 0;
  for (let i = 0; i < maxLength; i++) {
    for (let j = i; j < length; j += maxLength) {
      originalValue[j] = value[index++];
    }
  }
  value = originalValue.join("");

  // Get ordered hash
  const orderedHashed = value + seed;

  // Decode the hash
  const decoded = Buffer.from(orderedHashed, "base64").toString("utf-8");
  if (decoded.length !== 6) return null;

  // Check if the input for server ID is valid
  const decodedServerId = decoded.slice(0, 2);
  if (decodedServerId.length !== 2) return null;

  const serverId = decodedServerId.charCodeAt(0) * 128 + decodedServerId.charCodeAt(1);
  if (serverId < 0 || serverId > 16384) return null;

  // Check if the input for server room ID is valid
  const serverRoomId = decoded.slice(2);
  if (serverRoomId.length !== 4) return null;

  // Return server ID and server room ID
  return { serverId, serverRoomId };
}
