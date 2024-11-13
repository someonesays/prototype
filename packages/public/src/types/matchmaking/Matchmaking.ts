import type { JWTPayload } from "hono/utils/jwt/types";

export type MatchmakingDataJWT = MatchmakingData & JWTPayload;

export interface MatchmakingResponse {
  authorization: string;
  data: MatchmakingData;
}

export interface MatchmakingData {
  user: {
    id: string;
    displayName: string;
  };
  room: {
    id: string;
    server: {
      id: number;
      url: string;
    };
  };
  exp: number;
}
