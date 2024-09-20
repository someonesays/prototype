/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  Ping = 0,
  GetInformation = 1, // Send the room and player information, along with the room and player states.
  NewChatMessage = 2,
  PlayerJoin = 3, // Player joined the room
  PlayerLeft = 4, // Player left or got kicked out of the room (no need for a MinigamePlayerLeft)
  TransferHost = 5, // Transferred host to another player
  UpdatedRoomSettings = 6, // Updated room settings
  UpdatedScreen = 7, // Change the game's screen: either the leaderboards page or a minigame
  UpdatedLeaderboards = 8, // Update the game's leaderboards
  MinigamePlayerReady = 9, // Send that a player has loaded a minigame (player ready event for minigames)
  MinigameStartGame = 10, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MinigameSetGameState = 11,
  MinigameSetPlayerState = 12,
  MinigameSendGameMessage = 13,
  MinigameSendPlayerMessage = 14,
}
