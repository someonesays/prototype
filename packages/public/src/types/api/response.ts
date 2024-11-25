import { type ErrorMessageCodes } from "../../types";

export interface ApiErrorResponse {
  code: ErrorMessageCodes;
}

export interface ApiRoomExists {
  exists: boolean;
}
