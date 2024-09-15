/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  Ping = 0,
  GetInformation = 1, // Send the room and player information, along with the room and player states.
  NewChatMessage = 2,
  PlayerJoin = 3, // Player joined the room
  PlayerLeft = 4, // Player left or got kicked out of the room (no need for a PromptPlayerLeft)
  TransferHost = 5, // Transferred host to another player
  UpdatedRoomSettings = 6, // Updated room settings
  UpdatedScreen = 7, // Change the game's screen: either the leaderboards page or a prompt
  UpdatedLeaderboards = 8, // Update the game's leaderboards
  PromptPlayerReady = 9, // Send that a player has loaded a prompt (player ready event for prompts)
  PromptStartGame = 10, // Start the prompt's game (host has to be ready then it gives everyone else 30 more seconds to load the prompt iframe as well)
  PromptSetGameState = 11,
  PromptSetPlayerState = 12,
  PromptSendGameMessage = 13,
  PromptSendPlayerMessage = 14,
}
