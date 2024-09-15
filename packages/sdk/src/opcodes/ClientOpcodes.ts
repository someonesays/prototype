/**
 * These are the opcodes the parent page sends to the server
 */
export enum ClientOpcodes {
  Ping = 0,
  ChatMessage = 1,
  KickPlayer = 2,
  TransferHost = 3, // (Disallow running this mid-game)
  SetRoomSettings = 4,
  BeginGame = 5, // Actually begins the game (not a prompt)
  EndGame = 6, // Force a game to end (back to the room lobby screen)
  PromptHandshake = 7,
  PromptEndGame = 8,
  PromptSetGameState = 9,
  PromptSetPlayerState = 10,
  PromptSetGameMessage = 11,
  PromptSetPlayerMessage = 12,
}
