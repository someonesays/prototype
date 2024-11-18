import { z } from "zod";
import { MatchmakingType } from "@/public";

export const zodPostMatchmakingValidatorDiscord = z.object({
  type: z.literal(MatchmakingType.Discord),
  instance_id: z.string().min(1),
  code: z.string().min(1),
});

export const zodPostMatchmakingValidator = z.union([
  z.object({
    type: z.literal(MatchmakingType.Guest),
    display_name: z.string().min(1).max(32),
    room_id: z.string().length(8).optional(),
  }),
  z.object({
    // TOOD: Add authentication for people who have accounts
    type: z.literal(MatchmakingType.Authenticated),
  }),
  zodPostMatchmakingValidatorDiscord,
]);
