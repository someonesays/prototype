import { z } from "zod";

export enum GamePrizeType {
  PARTICIPATION = 0,
  WINNER = 1,
  SECOND = 2,
  THIRD = 3,
}

export const GamePrizePoints = {
  [GamePrizeType.PARTICIPATION]: 1,
  [GamePrizeType.WINNER]: 5,
  [GamePrizeType.SECOND]: 4,
  [GamePrizeType.THIRD]: 3,
};

export type GamePrize = z.infer<typeof GamePrizeZod>;

export const GamePrizeZod = z.object({
  user: z.string().min(1).max(50),
  type: z.nativeEnum(GamePrizeType),
});

export const GamePrizeArrayZod = z.array(GamePrizeZod);
