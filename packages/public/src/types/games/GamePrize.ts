import { z } from "zod";

export enum GamePrizeType {
  WINNER = 1,
  SECOND = 2,
  THIRD = 3,
}

export const GamePrizePoints = {
  [GamePrizeType.WINNER]: 3,
  [GamePrizeType.SECOND]: 2,
  [GamePrizeType.THIRD]: 1,
};

export type GamePrize = z.infer<typeof GamePrizeZod>;

export const GamePrizeZod = z.object({
  user: z.string().min(1).max(50),
  type: z.nativeEnum(GamePrizeType),
});

export const GamePrizeArrayZod = z.array(GamePrizeZod);
