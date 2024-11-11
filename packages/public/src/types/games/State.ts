import { z } from "zod";

// Types
export type State =
  | boolean
  | number
  | string
  | null
  | {
      [key: string]: State;
    }
  | State[];

// Zod
export const StateZod: z.ZodSchema<State> = z.lazy(() =>
  z.union([z.boolean(), z.number(), z.string(), z.record(StateZod), z.array(StateZod)]).nullable(),
);
