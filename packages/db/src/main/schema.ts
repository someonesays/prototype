import * as users from "../../schema/users";

import * as minigames from "../../schema/minigames";
import * as packs from "../../schema/packs";
import * as packMinigames from "../../schema/packMinigames";

import * as servers from "../../schema/servers";

export default {
  ...users,

  ...minigames,
  ...packs,
  ...packMinigames,

  ...servers,
};
