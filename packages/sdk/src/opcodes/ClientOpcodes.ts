/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  Ping = 0,
  KickPlayer = 1,
  TransferHost = 2, // (Disallow running this mid-game)
  SetRoomSettings = 3,
  BeginGame = 4, // Actually begins the game (not a minigame)
  MinigameHandshake = 5,
  MinigameEndGame = 6, // End the minigame game
  MinigameSetGameState = 7,
  MinigameSetPlayerState = 8,
  MinigameSendGameMessage = 9,
  MinigameSendPlayerMessage = 10,
  MinigameSendPrivateMessage = 11, // Player message to host only
}
