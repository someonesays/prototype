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
  [ServerOpcodes.MinigamePlayerReady]: {};
  [ServerOpcodes.MinigameStartGame]: {};
  [ServerOpcodes.MinigameSetGameState]: {};
  [ServerOpcodes.MinigameSetPlayerState]: {};
  [ServerOpcodes.MinigameSendGameMessage]: {};
  [ServerOpcodes.MinigameSendPlayerMessage]: {};
}
