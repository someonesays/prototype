/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  // Ping = 0,
  // Error = 1,
  GetInformation = 2, // Send the room and player information, along with the room and player states.
  PlayerJoin = 3, // Player joined the room
  PlayerLeft = 4, // Player left or got kicked out of the room (no need for a MinigamePlayerLeft)
  TransferHost = 5, // Transferred host to another player
  UpdatedRoomSettings = 6, // Updated room settings
  UpdatedScreen = 7, // Change the game's screen: either the leaderboards page or a minigame
  PlayerReady = 8, // Send that a player has loaded a minigame (player ready event for minigames)
  MinigameStartGame = 9, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MinigameSetGameState = 10,
  MinigameSetPlayerState = 11,
  MinigameSendGameMessage = 12,
  MinigameSendPlayerMessage = 13,
  MinigameSendPrivateMessage = 14,
}
