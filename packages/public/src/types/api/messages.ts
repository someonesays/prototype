export enum MessageCodes {
  HELLO_WORLD = "hello_world",
  NOT_FOUND = "not_found",
  UNEXPECTED_ERROR = "unexpected_error",
  INVALID_AUTHORIZATION = "missing_authorization",
  RATE_LIMITED = "rate_limited",
  INTERNAL_ERROR = "internal_error",
  FAILED_CAPTCHA = "failed_captcha",

  FAILED_TO_FETCH = "failed_to_fetch",
  INVALID_CONTENT_TYPE = "invalid_content_type",

  SUCCESS = "success",

  MISSING_LOCATION = "missing_location",
  ROOM_NOT_FOUND = "room_not_found",
  SERVERS_BUSY = "servers_busy",
  NOT_IMPLEMENTED = "not_implemented",

  ALREADY_IN_GAME = "already_in_game",
  REACHED_MAXIMUM_PLAYER_LIMIT = "reached_maximum_player_limit",
  KICKED_FROM_ROOM = "kicked_from_room",
}

export const MessageCodesToText = {
  [MessageCodes.HELLO_WORLD]: "Hello world!",
  [MessageCodes.NOT_FOUND]: "Not found.",
  [MessageCodes.UNEXPECTED_ERROR]: "An unexpected error has occurred.",
  [MessageCodes.INVALID_AUTHORIZATION]: "Invalid authorization!",
  [MessageCodes.RATE_LIMITED]: "You are currently being rate limited. Please try again in a bit.",
  [MessageCodes.INTERNAL_ERROR]: "An internal error has occurred.",
  [MessageCodes.FAILED_CAPTCHA]: "Failed to validate captcha.",

  [MessageCodes.FAILED_TO_FETCH]: "Failed to fetch.",
  [MessageCodes.INVALID_CONTENT_TYPE]: "Invalid Content-Type.",

  [MessageCodes.SUCCESS]: "Success!",

  [MessageCodes.MISSING_LOCATION]: "Missing location.",
  [MessageCodes.ROOM_NOT_FOUND]: "The room could not be found.",
  [MessageCodes.SERVERS_BUSY]: "The servers are currently busy! Please try again later.",
  [MessageCodes.NOT_IMPLEMENTED]: "This has not been implemented.",

  [MessageCodes.ALREADY_IN_GAME]: "A player with given ID is already in the game.",
  [MessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT]: "Reached maximum player limit in this room.",
  [MessageCodes.KICKED_FROM_ROOM]: "You've been kicked from the room!",
};
