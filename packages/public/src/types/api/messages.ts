export enum MessageCodes {
  HelloWorld = "hello_world",
  NotFound = "not_found",
  UnexpectedError = "unexpected_error",
  InvalidAuthorization = "missing_authorization",
  RateLimited = "rate_limited",
  InternalError = "internal_error",

  RoomNotFound = "room_not_found",
  ServersBusy = "servers_busy",
  NotImplemented = "not_implemented",

  AlreadyInGame = "already_in_game",
  ReachedMaximumPlayerLimit = "reached_maximum_player_limit",
  KickedFromRoom = "kicked_from_room",
}

export const MessageCodesToText = {
  [MessageCodes.HelloWorld]: "Hello world!",
  [MessageCodes.NotFound]: "Not found.",
  [MessageCodes.UnexpectedError]: "An unexpected error has occurred.",
  [MessageCodes.InvalidAuthorization]: "Invalid authorization!",
  [MessageCodes.RateLimited]: "You are currently being rate limited. Please try again in a bit.",
  [MessageCodes.InternalError]: "An internal error has occurred.",

  [MessageCodes.RoomNotFound]: "The room could not be found.",
  [MessageCodes.ServersBusy]: "The servers are currently busy! Please try again later.",
  [MessageCodes.NotImplemented]: "This has not been implemented.",

  [MessageCodes.AlreadyInGame]: "A player with given ID is already in the game.",
  [MessageCodes.ReachedMaximumPlayerLimit]: "Reached maximum player limit in this room.",
  [MessageCodes.KickedFromRoom]: "You've been kicked from the room!",
};
