import { type MessageCodes, type MatchmakingDataJWT } from "../../types";

export interface APIResponse {
  code: MessageCodes;
}

export interface APIMatchmakingResponse {
  authorization: string;
  data: MatchmakingDataJWT;
}

export interface APIRoomExists {
  exists: boolean;
}
