export enum ErrorMessageCodes {
  NOT_FOUND = "not_found",
  UNEXPECTED_ERROR = "unexpected_error",
  INVALID_AUTHORIZATION = "missing_authorization",
  RATE_LIMITED = "rate_limited",
  INTERNAL_ERROR = "internal_error",
  FAILED_CAPTCHA = "failed_captcha",

  FAILED_TO_FETCH = "failed_to_fetch",
  INVALID_CONTENT_TYPE = "invalid_content_type",

  CANNOT_FIND_MINIGAME_FOR_PACK = "cannot_find_minigame_for_pack",
  MINIGAME_ALREADY_IN_PACK = "minigame_already_in_pack",

  REACHED_MINIGAME_LIMIT = "reached_minigame_limit",
  REACHED_PACK_LIMIT = "reached_pack_limit",

  MISSING_LOCATION = "missing_location",
  ROOM_NOT_FOUND = "room_not_found",
  SERVERS_BUSY = "servers_busy",
  NOT_IMPLEMENTED = "not_implemented",

  ALREADY_IN_GAME = "already_in_game",
  REACHED_MAXIMUM_PLAYER_LIMIT = "reached_maximum_player_limit",
  KICKED_FROM_ROOM = "kicked_from_room",
}

export const ErrorMessageCodesToText = {
  [ErrorMessageCodes.NOT_FOUND]: "Not found.",
  [ErrorMessageCodes.UNEXPECTED_ERROR]: "An unexpected error has occurred.",
  [ErrorMessageCodes.INVALID_AUTHORIZATION]: "Invalid authorization!",
  [ErrorMessageCodes.RATE_LIMITED]: "You are currently being rate limited. Please try again in a bit.",
  [ErrorMessageCodes.INTERNAL_ERROR]: "An internal error has occurred.",
  [ErrorMessageCodes.FAILED_CAPTCHA]: "Failed to validate captcha.",

  [ErrorMessageCodes.FAILED_TO_FETCH]: "Failed to fetch.",
  [ErrorMessageCodes.INVALID_CONTENT_TYPE]: "Invalid Content-Type.",

  [ErrorMessageCodes.CANNOT_FIND_MINIGAME_FOR_PACK]: "Failed to find the minigame to add to the pack.",
  [ErrorMessageCodes.MINIGAME_ALREADY_IN_PACK]: "The minigame is already in the pack.",

  [ErrorMessageCodes.REACHED_MINIGAME_LIMIT]: "You have reached the minigames limit! (100)",
  [ErrorMessageCodes.REACHED_PACK_LIMIT]: "You have reached the packs limit! (50)",

  [ErrorMessageCodes.MISSING_LOCATION]: "Missing location.",
  [ErrorMessageCodes.ROOM_NOT_FOUND]: "The room could not be found.",
  [ErrorMessageCodes.SERVERS_BUSY]: "The servers are currently busy! Please try again later.",
  [ErrorMessageCodes.NOT_IMPLEMENTED]: "This has not been implemented.",

  [ErrorMessageCodes.ALREADY_IN_GAME]: "A player with given ID is already in the game.",
  [ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT]: "Reached maximum player limit in this room.",
  [ErrorMessageCodes.KICKED_FROM_ROOM]: "You've been kicked from the room!",
};
