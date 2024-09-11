// These are the opcodes the parent page sends to the prompt's iframe
export enum ParentOpcodes {
  Ping = 0,
  GetInformation = 1,
  StartGame = 2,
  PlayerJoined = 3,
  PlayerLeft = 4,
  UpdatedGameState = 5,
  UpdatedUserState = 6,
  ReceivedGameMessage = 7,
  ReceivedUserMessage = 8,
}

// These are the opcodes the prompt's iframe to the parent page
export enum PromptOpcodes {
  Ping = 0,
  Ready = 1,
  EndGame = 2, // Host only
  SetGameState = 3, // Host only
  SetUserState = 4,
  SendGameMessage = 5, // Host only
  SendUserMessage = 6,
}
