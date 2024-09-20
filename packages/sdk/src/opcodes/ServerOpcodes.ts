/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  Ping = 0,
  GetInformation = 1, // Send the room and player information, along with the room and player states.
  PlayerJoin = 2, // Player joined the room
  PlayerLeft = 3, // Player left or got kicked out of the room (no need for a MinigamePlayerLeft)
  TransferHost = 4, // Transferred host to another player
  UpdatedRoomSettings = 5, // Updated room settings
  UpdatedScreen = 6, // Change the game's screen: either the leaderboards page or a minigame
  MinigamePlayerReady = 7, // Send that a player has loaded a minigame (player ready event for minigames)
  MinigameStartGame = 8, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MinigameSetGameState = 9,
  MinigameSetPlayerState = 10,
  MinigameSendGameMessage = 11,
  MinigameSendPlayerMessage = 12,
}
