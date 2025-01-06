/**
 * These are the opcodes the minigame's iframe to the parent page
 */
export enum MinigameOpcodes {
  /**
   * The parent initiates the iframe and waits for a HANDSHAKE message.
   *
   * Sending a HANDSHAKE message is the equivalence to successfully connecting to a minigame.
   * You'll only start receiving events after the handshake is sent.
   */
  HANDSHAKE = "handshake",
  /**
   * End the minigame.
   *
   * Only the host can send this message.
   */
  END_GAME = "end_game",
  /**
   * Set the minigame's local data store
   */
  SAVE_LOCAL_DATA = "save_local_data",
  /**
   * Set the game's state (persistent until the minigame ends).
   *
   * Only the host can send this message.
   */
  SET_GAME_STATE = "set_game_state",
  /**
   * Set your own player state (persistent until the minigame ends).
   *
   * The host can modify player states.
   */
  SET_PLAYER_STATE = "set_player_state",
  /**
   * Send a game message (one-time, think of it like a system message).
   *
   * Only the host can send this message.
   */
  SEND_GAME_MESSAGE = "send_game_message",
  /**
   * Send a player message (one-time, think of it like a system message).
   */
  SEND_PLAYER_MESSAGE = "send_player_message",
  /**
   * Send a private player message to another player (host by default).
   *
   * Only the host can send messages to other players.
   * Everyone else can only send private messages to the host.
   */
  SEND_PRIVATE_MESSAGE = "send_private_message",
  /**
   * Send a binary game message.
   *
   * Only the host can send this message.
   */
  SEND_BINARY_GAME_MESSAGE = "send_binary_game_message",
  /**
   * Send a binary player message.
   */
  SEND_BINARY_PLAYER_MESSAGE = "send_binary_player_message",
  /**
   * Send a binary private player message to another player (host by default).
   *
   * Only the host can send messages to other players.
   * Everyone else can only send private messages to the host.
   */
  SEND_BINARY_PRIVATE_MESSAGE = "send_binary_private_message",
}
