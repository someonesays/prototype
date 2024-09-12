/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  Ping = 0,
}

/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  Ping = 0,
  // GetInformation = 1, // Send the room and player information, along with the room and player states.
  // UpdatedScreen = 2, // Change the game's screen: either the leaderboards page or a prompt
}
