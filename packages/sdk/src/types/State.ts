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
export const stateZod: z.ZodSchema<State> = z.lazy(() =>
  z.union([z.boolean(), z.number(), z.string(), z.record(stateZod), z.array(stateZod)]).nullable(),
);
