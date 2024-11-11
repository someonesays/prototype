import { z } from "zod";

export enum GamePrizeType {
  Participation = 0,
  Winner = 1,
  Second = 2,
  Third = 3,
}

export type GamePrize = z.infer<typeof GamePrizeZod>;

export const GamePrizeZod = z.object({
  user: z.string().min(1).max(50),
  type: z.nativeEnum(GamePrizeType),
});

export const GamePrizeArrayZod = z.array(GamePrizeZod);
