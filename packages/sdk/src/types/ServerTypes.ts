import { ServerOpcodes } from "../opcodes";

export interface ServerTypes {
  [ServerOpcodes.Ping]: {};
  [ServerOpcodes.GetInformation]: {};
  [ServerOpcodes.NewChatMessage]: {};
  [ServerOpcodes.PlayerJoin]: {};
  [ServerOpcodes.PlayerLeft]: {};
  [ServerOpcodes.TransferHost]: {};
  [ServerOpcodes.UpdatedRoomSettings]: {};
  [ServerOpcodes.UpdatedScreen]: {};
  [ServerOpcodes.UpdatedLeaderboards]: {};
  [ServerOpcodes.PromptPlayerReady]: {};
  [ServerOpcodes.PromptStartGame]: {};
  [ServerOpcodes.PromptSetGameState]: {};
  [ServerOpcodes.PromptSetPlayerState]: {};
  [ServerOpcodes.PromptSendGameMessage]: {};
  [ServerOpcodes.PromptSendPlayerMessage]: {};
}
