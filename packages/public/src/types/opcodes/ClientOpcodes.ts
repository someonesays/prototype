/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  PING = 0,
  KICK_PLAYER = 1, // (Disallow running this mid-game)
  TRANSFER_HOST = 2, // (Disallow running this mid-game)
  SET_ROOM_SETTINGS = 3,
  SELECT_PREVIOUS_OR_NEXT_MINIGAME = 4,
  BEGIN_GAME = 5, // Actually begins the game (not a minigame)
  MINIGAME_HANDSHAKE = 6,
  MINIGAME_END_GAME = 7, // End the minigame game
  MINIGAME_SET_GAME_STATE = 8,
  MINIGAME_SET_PLAYER_STATE = 9,
  MINIGAME_SEND_GAME_MESSAGE = 10,
  MINIGAME_SEND_PLAYER_MESSAGE = 11,
  MINIGAME_SEND_PRIVATE_MESSAGE = 12, // Player message to host only or host messages a player
  MINIGAME_SEND_BINARY_GAME_MESSAGE = 13,
  MINIGAME_SEND_BINARY_PLAYER_MESSAGE = 14,
  MINIGAME_SEND_BINARY_PRIVATE_MESSAGE = 15,
}
