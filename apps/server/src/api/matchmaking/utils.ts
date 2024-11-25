import { z } from "zod";
import { MatchmakingLocation, MatchmakingType } from "@/public";

export const zodPostMatchmakingValidatorNormal = z.object({
  type: z.literal(MatchmakingType.NORMAL),
  displayName: z.string().min(1).max(32),
  location: z.nativeEnum(MatchmakingLocation).optional(),
  roomId: z.string().length(10).optional(),
});

export const zodPostMatchmakingValidatorDiscord = z.object({
  type: z.literal(MatchmakingType.DISCORD),
  instanceId: z.string().min(1),
  code: z.string().min(1),
});
