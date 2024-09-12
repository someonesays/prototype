/**
 * These are the opcodes the parent page sends to the prompt's iframe
 */
export enum ParentOpcodes {
  /**
   * A ping was sent to the prompt.
   */
  Ping = 0,

  /**
   * Sent the room and user information, including the game's state and all user states.
   */
  GetInformation = 1,

  /**
   * The game has started.
   *
   * The prompt's game will "start" when everyone is readied.
   * The host needs to have the prompt loaded in for the game started.
   * If anyone takes over 30 seconds longer than the host to load the prompt, the game will start before they successfully load the prompt and will be treated as a user who joined the game mid-game.
   *
   * Also, it's necessary for the host to join to start the game, because they'll be treated like the "server" in a sense.
   */
  StartGame = 2,

  /**
   * A player joined the room and readied the prompt.
   *
   * When a player readies a prompt, the player joined event is given to all clients who are readied as well.
   */
  PlayerJoined = 3,

  /**
   * If a player leaves, a player left state will be given.
   *
   * If the host leaves, the PlayerLeft event will not be given to the prompt, because the game will alert every player that the host has left and forcibly end the prompt.
   *
   * The prompt will end with "no winner" and nobody will gain points.
   */
  PlayerLeft = 4,

  /**
   * The game's state has been updated.
   */
  UpdatedGameState = 5,

  /**
   * The user's state has been updated.
   */
  UpdatedUserState = 6,

  /**
   * The game's host has sent a one-time message (think of it like a system message).
   */
  ReceivedGameMessage = 7,

  /**
   * A user has sent a one-time message.
   */
  ReceivedUserMessage = 8,
}

/**
 * These are the opcodes the prompt's iframe to the parent page
 */
export enum PromptOpcodes {
  /**
   * Sends a ping to the parent website.
   */
  Ping = 0,

  /**
   * The parent initiates the iframe and waits for a Ready message.
   *
   * Sending a Ready message will be the equivalence to succesfully connecting to a game/prompt.
   * You'll only start receiving game and player states and messages after you ready up.
   */
  Ready = 1,

  /**
   * When the host ends the game, they'll also provide information, such as who won (up to top 3, optional) and anyone else who should earn participation points (aka they did what the prompt told them to do, also optional).
   * 
   * The prompt should display who won and gained points once the game ends, before sending the EndGame message.
   * 
   * The prompt will never recieve the EndGame message, because when the game ends, the iframe will be deleted
and it will display the leaderboards.
   */
  EndGame = 2, // Host only

  /**
   * Set the game's state (persistent until the prompt's game ends).
   *
   * Only the host can send this message.
   */
  SetGameState = 3, // Host only

  /**
   * Set your own user state (persistent until the prompt's game ends).
   *
   * The host can modify anyone's user state.
   */
  SetUserState = 4,

  /**
   * Send a game message (one-time, think of it like a system message).
   *
   * Only the host can send this message.
   */
  SendGameMessage = 5, // Host only

  /**
   * Send a user message.
   *
   * The host can modify anyone's user state.
   */
  SendUserMessage = 6,
}
