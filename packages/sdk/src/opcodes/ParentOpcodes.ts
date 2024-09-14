/**
 * These are the opcodes the parent page sends to the prompt's iframe
 */
export enum ParentOpcodes {
  /**
   * Sent the room and user information, including the game's state and all user states.
   */
  Ready = "ready",

  /**
   * The game has started.
   *
   * The prompt's game will "start" when everyone is readied.
   * The host needs to have the prompt loaded in for the game started.
   * If anyone takes over 30 seconds longer than the host to load the prompt, the game will start before they successfully load the prompt and will be treated as a user who joined the game mid-game.
   *
   * Also, it's necessary for the host to join to start the game, because they'll be treated like the "server" in a sense.
   */
  StartGame = "start_game",

  /**
   * A player joined the room and readied the prompt.
   *
   * When a player readies a prompt, the player joined event is given to all clients who are readied as well.
   */
  PlayerJoined = "player_joined",

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
   * The user's state has been updated.
   */
  UpdatedUserState = "updated_user_state",

  /**
   * The game's host has sent a one-time message (think of it like a system message).
   */
  ReceivedGameMessage = "received_game_message",

  /**
   * A user has sent a one-time message.
   */
  ReceivedUserMessage = "received_user_message",
}
