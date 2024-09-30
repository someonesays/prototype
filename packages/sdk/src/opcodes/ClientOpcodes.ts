/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  Ping = 0,
  KickPlayer = 1,
  TransferHost = 2, // (Disallow running this mid-game)
  SetRoomSettings = 3,
  BeginGame = 4, // Actually begins the game (not a minigame)
  EndGame = 5, // Force a game to end (back to the room lobby screen)
  MinigameHandshake = 6,
  MinigameEndGame = 7, // End the minigame game
  MinigameSetGameState = 8,
  MinigameSetPlayerState = 9,
  MinigameSendGameMessage = 10,
  MinigameSendPlayerMessage = 11,
  MinigameSendPrivateMessage = 12, // Player message to host only
}
