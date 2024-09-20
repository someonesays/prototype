/**
 * These are the opcodes the parent page sends to the prompt's iframe
 */
export enum ParentOpcodes {
  /**
   * Sent the room and player information, including the game's state and all player states.
   * This should also include player settings, such as volume and language.
   */
  Ready = "ready",
  /**
   * Updated player's settings
   */
  UpdateSettings = "update_settings",
  /**
   * The game has started.
   *
   * The prompt's game will "start" when everyone is readied.
   * The host needs to have the prompt loaded in for the game started.
   * If anyone takes over 30 seconds longer than the host to load the prompt, the game will start before they successfully load the prompt and will be treated as a player who joined the game mid-game.
   *
   * Also, it's necessary for the host to join to start the game, because they'll be treated like the "server" in a sense.
   */
  StartGame = "start_game",
  /**
   * A player readied the prompt (consider this as a player join event on prompts).
   *
   * When a player readies a prompt, the player joined event is given to all clients who are readied as well.
   */
  PlayerReady = "player_ready",
  /**
   * If a player leaves, a player left state will be given.
   *
   * If the host leaves, the PlayerLeft event will not be given to the prompt, because the game will alert every player that the host has left and forcibly end the prompt.
   *
   * The prompt will end with "no winner" and nobody will gain points.
   */
  PlayerLeft = "player_left",
  /**
   * The game's state has been updated.
   */
  UpdatedGameState = "updated_game_state",
  /**
   * The player's state has been updated.
   */
  UpdatedPlayerState = "updated_player_state",
  /**
   * The game's host has sent a one-time message (think of it like a system message).
   */
  ReceivedGameMessage = "received_game_message",
  /**
   * A player has sent a one-time message.
   */
  ReceivedPlayerMessage = "received_player_message",
}
