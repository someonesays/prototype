/**
 * These are the opcodes the prompt's iframe to the parent page
 */
export enum PromptOpcodes {
  /**
   * Sends a ping to the parent website.
   */
  Ping = "ping",

  /**
   * The parent initiates the iframe and waits for a Ready message.
   *
   * Sending a Ready message will be the equivalence to succesfully connecting to a game/prompt.
   * You'll only start receiving game and player states and messages after you ready up.
   */
  Ready = "ready",

  /**
   * When the host ends the game, they'll also provide information, such as who won (up to top 3, optional) and anyone else who should earn participation points (aka they did what the prompt told them to do, also optional).
   * 
   * The prompt should display who won and gained points once the game ends, before sending the EndGame message.
   * 
   * The prompt will never recieve the EndGame message, because when the game ends, the iframe will be deleted
and it will display the leaderboards.
   */
  EndGame = "end_game", // Host only

  /**
   * Set the game's state (persistent until the prompt's game ends).
   *
   * Only the host can send this message.
   */
  SetGameState = "set_game_state", // Host only

  /**
   * Set your own user state (persistent until the prompt's game ends).
   *
   * The host can modify anyone's user state.
   */
  SetUserState = "set_user_state",

  /**
   * Send a game message (one-time, think of it like a system message).
   *
   * Only the host can send this message.
   */
  SendGameMessage = "send_game_message", // Host only

  /**
   * Send a user message.
   *
   * The host can modify anyone's user state.
   */
  SendUserMessage = "send_user_message",
}
