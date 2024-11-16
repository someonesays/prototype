import type { EnumValueStrings } from "./utils";

/**
 * These are the opcodes the server sends to the parent page
 */
export enum ServerOpcodes {
  Disconnected = -1, // This isn't actually ever sent through the WebSocket but it's intended for ease
  // Ping = 0,
  Error = 1,
  GetInformation = 2, // Send the room and player information, along with the room and player states.
  PlayerJoin = 3, // Player joined the room
  PlayerLeft = 4, // Player left or got kicked out of the room (no need for a MinigamePlayerLeft)
  TransferHost = 5, // Transferred host to another player
  UpdatedRoomSettings = 6, // Updated room settings
  LoadMinigame = 7, // Load a minigame
  EndMinigame = 8, // End a minigame
  MinigamePlayerReady = 9, // Send that a player has loaded a minigame (player ready event for minigames)
  MinigameStartGame = 10, // Start the minigame's game (host has to be ready then it gives everyone else 30 more seconds to load the minigame iframe as well)
  MinigameSetGameState = 11,
  MinigameSetPlayerState = 12,
  MinigameSendGameMessage = 13,
  MinigameSendPlayerMessage = 14,
  MinigameSendPrivateMessage = 15,
}

// This is used on the game's frontend because event emitters have to be strings
export type ServerOpcodesStringKeys = EnumValueStrings<typeof ServerOpcodes>;
