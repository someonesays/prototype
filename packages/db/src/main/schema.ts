import * as users from "../../schema/users";
import * as minigames from "../../schema/minigames";
import * as servers from "../../schema/servers";

export default {
  ...users,
  ...minigames,
  ...servers,
};
