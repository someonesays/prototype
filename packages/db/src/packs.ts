import { PackVisibility } from "@/public";
import { minigames } from "./minigames";

export const packs = [
  {
    id: "1",
    name: "Example pack name",
    description: "This is the pack's description.",
    iconImage: null,
    iconPlaceholderImage: null, // This is meant for stuff such as ThumbHash.
    visibility: PackVisibility.Public,
    author: {
      name: "Someone",
    },
    minigames: [minigames[0], minigames[1]],
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
  },
];
