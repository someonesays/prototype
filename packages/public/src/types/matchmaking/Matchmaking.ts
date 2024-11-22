import type { JWTPayload } from "hono/utils/jwt/types";

export type MatchmakingDataJWT = MatchmakingData & JWTPayload;

export interface MatchmakingResponse {
  authorization: string;
  data: MatchmakingData;
}

export interface MatchmakingData {
  user: {
    id: string;
    display_name: string;
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
  exp: number;
}
