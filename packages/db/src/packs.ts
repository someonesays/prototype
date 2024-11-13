import { PackVisibility } from "@/public";
import { minigames } from "./minigames";

export const packs = [
  {
    id: "1",
    visibility: PackVisibility.Public,
    author: {
      name: "Someone",
    },
    minigames: [minigames[0], minigames[1]],
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
