/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  Ping = 0,
  ChatMessage = 1,
  KickPlayer = 2,
  TransferHost = 3, // (Disallow running this mid-game)
  SetRoomSettings = 4,
  BeginGame = 5, // Actually begins the game (not a minigame)
  EndGame = 6, // Force a game to end (back to the room lobby screen)
  MinigameHandshake = 7,
  MinigameEndGame = 8,
  MinigameSetGameState = 9,
  MinigameSetPlayerState = 10,
  MinigameSetGameMessage = 11,
  MinigameSetPlayerMessage = 12,
}
