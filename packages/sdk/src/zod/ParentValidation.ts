import z from "zod";
import { ParentOpcodes } from "../opcodes";

export const ParentValidation = {
  [ParentOpcodes.Ping]: z.object({}),
  [ParentOpcodes.Ready]: z.object({
    test: z.literal("test"),
  }),
  [ParentOpcodes.StartGame]: z.object({}),
  [ParentOpcodes.PlayerJoined]: z.object({}),
  [ParentOpcodes.PlayerLeft]: z.object({}),
  [ParentOpcodes.UpdatedGameState]: z.object({}),
  [ParentOpcodes.UpdatedUserState]: z.object({}),
  [ParentOpcodes.ReceivedGameMessage]: z.object({}),
  [ParentOpcodes.ReceivedUserMessage]: z.object({}),
};
