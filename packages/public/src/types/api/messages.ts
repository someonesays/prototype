export enum MessageCodes {
  HelloWorld = "hello_world",
  NotFound = "not_found",
  UnexpectedError = "unexpected_error",
  MissingAuthorization = "missing_authorization",

  RoomNotFound = "room_not_found",
  ServersBusy = "servers_busy",

  AlreadyInGame = "already_in_game",
  ReachedMaximumPlayerLimit = "reached_maximum_player_limit",
  KickedFromRoom = "kicked_from_room",
}

export const MessageCodesToText = {
  [MessageCodes.HelloWorld]: "Hello world!",
  [MessageCodes.NotFound]: "Not found.",
  [MessageCodes.UnexpectedError]: "An unexpected error has occurred.",
  [MessageCodes.MissingAuthorization]: "Missing authorization token!",

  [MessageCodes.RoomNotFound]: "The room was not found.",
  [MessageCodes.ServersBusy]: "The servers are currently busy! Please try again later.",

  [MessageCodes.AlreadyInGame]: "A player with given ID is already in the game.",
  [MessageCodes.ReachedMaximumPlayerLimit]: "Reached maximum player limit in this room.",
  [MessageCodes.KickedFromRoom]: "You've been kicked from the room!",
};
