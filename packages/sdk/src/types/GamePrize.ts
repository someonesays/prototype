import { z } from "zod";

export enum GamePrize {
  Participation = 0,
  Winner = 1,
  Second = 2,
  Third = 3,
}

export const GamePrizeArrayZod = z.array(
  // WIP: Add proper validation for the winner ID and participation IDs
  // WIP: Make sure to disallow repeating PrizeType.Winner, PrizeType.Second and PrizeType.Third
  z.object({
    user: z.string(),
    type: z.nativeEnum(GamePrize),
  }),
);
