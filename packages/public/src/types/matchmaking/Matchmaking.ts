import type { JWTPayload } from "hono/utils/jwt/types";
import type { MatchmakingType } from "../../types";

export type MatchmakingDataJWT = MatchmakingData & JWTPayload;

export interface MatchmakingResponse {
  authorization: string;
  data: MatchmakingData;
}

export interface MatchmakingData {
  type: "matchmaking";
  user: {
    id: string;
    displayName: string;
    avatar: string;
  };
  room: {
    id: string;
    server: {
      id: string;
      url: string;
      location: string;
    };
  };
  metadata: MatchmakingResponseMetadata;
  iat: number;
  exp: number;
}

export type MatchmakingResponseMetadata =
  | MatchmakingResponseNormal
  | MatchmakingResponseTesting
  | MatchmakingResponseMetadataDiscord;

export interface MatchmakingResponseNormal {
  type: MatchmakingType.NORMAL;
  // The value 'creating' doesn't enforce if a JWT can be used to create or join a room
  // It only prevents a race-condition in matchmaking where 2 people can be assigned to the same room when creating one
  // It'll prevent the user from joining the room if creating == true and the room with the given ID already exists
  creating: boolean;
  mobile: boolean;
}

export interface MatchmakingResponseTesting {
  type: MatchmakingType.TESTING;
  minigameId: string;
  testingAccessCode: string;
}

export interface MatchmakingResponseMetadataDiscord {
  type: MatchmakingType.DISCORD;
  accessToken: string;
  mobile: boolean;
}
