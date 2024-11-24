import { type MessageCodes } from "../../types";

export interface APIResponse {
  code: MessageCodes;
}

export interface APIRoomExists {
  exists: boolean;
}
