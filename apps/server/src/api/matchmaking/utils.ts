import { z } from "zod";
import { MatchmakingLocation, MatchmakingType } from "@/public";

export const zodPostMatchmakingValidatorDiscord = z.object({
  type: z.literal(MatchmakingType.Discord),
  instance_id: z.string().min(1),
  code: z.string().min(1),
});

export const zodPostMatchmakingValidator = z.union([
  // Create or join the room as a guest
  z.object({
    type: z.literal(MatchmakingType.Guest),
    captcha: z.string(),
    display_name: z.string().min(1).max(32),
    location: z.nativeEnum(MatchmakingLocation).optional(),
    room_id: z.string().length(10).optional(),
  }),
  // TODO: Join room as an authenticated user
  z.object({
    type: z.literal(MatchmakingType.Authenticated),
  }),
  // Join room through Discord activity
  zodPostMatchmakingValidatorDiscord,
]);
