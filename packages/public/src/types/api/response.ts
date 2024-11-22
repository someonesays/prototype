import { type MessageCodes, type MatchmakingDataJWT, MatchmakingType } from "../../types";

export interface APIResponse {
  code: MessageCodes;
}

export interface APIMatchmakingResponse {
  authorization: string;
  data: MatchmakingDataJWT;
  metadata: APIMatchmakingResponseMetadata;
}

export type APIMatchmakingResponseMetadata = APIMatchmakingResponseNormal | APIMatchmakingResponseMetadataDiscord;

export interface APIMatchmakingResponseNormal {
  type: MatchmakingType.Normal;
}

export interface APIMatchmakingResponseMetadataDiscord {
  type: MatchmakingType.Discord;
  access_token: string;
}

export interface APIRoomExists {
  exists: boolean;
}
