/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  PING = 0,
  KICK_PLAYER = 1, // (Disallow running this mid-game)
  TRANSFER_HOST = 2, // (Disallow running this mid-game)
  SET_ROOM_SETTINGS = 3,
  BEGIN_GAME = 4, // Actually begins the game (not a minigame)
  MINIGAME_HANDSHAKE = 5,
  MINIGAME_END_GAME = 6, // End the minigame game
  MINIGAME_SET_GAME_STATE = 7,
  MINIGAME_SET_PLAYER_STATE = 8,
  MINIGAME_SEND_GAME_MESSAGE = 9,
  MINIGAME_SEND_PLAYER_MESSAGE = 10,
  MINIGAME_SEND_PRIVATE_MESSAGE = 11, // Player message to host only or host messages a player
}
