/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  PING = 0,
  ERROR = 1,
  GET_INFORMATION = 2, // Send the room and player information, along with the room and player states.
  PLAYER_JOIN = 3, // Player joined the room
  PLAYER_LEFT = 4, // Player left or got kicked out of the room (no need for a MINIGAME_PLAYER_LEFT)
  TRANSFER_HOST = 5, // Transferred host to another player
  UPDATED_ROOM_SETTINGS = 6, // Updated room settings
  LOAD_MINIGAME = 7, // Load a minigame
  END_MINIGAME = 8, // End a minigame
  MINIGAME_PLAYER_READY = 9, // Send that a player has loaded a minigame (player ready event for minigames)
  MINIGAME_START_GAME = 10, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MINIGAME_SET_GAME_STATE = 11,
  MINIGAME_SET_PLAYER_STATE = 12,
  MINIGAME_SEND_GAME_MESSAGE = 13,
  MINIGAME_SEND_PLAYER_MESSAGE = 14,
  MINIGAME_SEND_PRIVATE_MESSAGE = 15,
}
