import { Buffer } from "buffer";
import {
  ClientOpcodes,
  ClientValidation,
  ServerOpcodes,
  type ServerTypes,
  type ClientOpcodeAndData,
  type ClientOpcodeAndDatas,
  type ServerOpcodeAndData,
  type ServerOpcodeAndDatas,
} from "@/public";
import type z from "zod";

export function encodeJsonClient<O extends ClientOpcodes>(payload: {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}) {
  if (
    [ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE, ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE].includes(
      payload.opcode,
    )
  ) {
    return JSON.stringify({
      opcode: payload.opcode,
      data: toHexString(payload.data as Uint8Array),
    });
  }

  if (payload.opcode === ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    const data = payload.data as z.infer<(typeof ClientValidation)[ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE]>;
    return JSON.stringify({
      opcode: payload.opcode,
      data: {
        user: data.user,
        message: toHexString(data.message),
      },
    });
  }

  return JSON.stringify({ opcode: payload.opcode, data: payload.data });
}

export function encodeJsonServer<O extends ServerOpcodes>(payload: {
  opcode: O;
  data: ServerTypes[O];
}) {
  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE) {
    if (!(payload.data instanceof Uint8Array)) throw new Error("Payload data must be Uint8Array");
    return JSON.stringify({
      opcode: payload.opcode,
      data: toHexString(payload.data),
    });
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE) {
    const data = payload.data as ServerTypes[ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE];
    return JSON.stringify({
      opcode: payload.opcode,
      data: {
        user: data.user,
        message: toHexString(data.message),
      },
    });
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    const data = payload.data as ServerTypes[ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE];
    return JSON.stringify({
      opcode: payload.opcode,
      data: {
        fromUser: data.fromUser,
        toUser: data.toUser,
        message: toHexString(data.message),
      },
    });
  }

  return JSON.stringify({ opcode: payload.opcode, data: payload.data });
}

export function decodeJsonClient(payload: { opcode: number; data: unknown }) {
  const opcode = Number(payload?.opcode) as ClientOpcodes;
  if (!ClientValidation[opcode]) throw new Error("Invalid opcode recieved");

  if (
    [ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE, ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE].includes(opcode)
  ) {
    if (typeof payload?.data !== "string") throw new Error("Failed data validation check");
    return {
      opcode,
      data: new Uint8Array(Buffer.from(payload?.data, "hex").buffer),
    } as
      | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE>
      | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>;
  }

  if (opcode === ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    if (
      typeof payload?.data !== "object" ||
      Array.isArray(payload.data) ||
      payload.data === null ||
      ("user" in payload.data &&
        (typeof payload.data.user !== "string" || payload.data.user.length < 1 || payload.data.user.length > 50)) ||
      !("message" in payload.data) ||
      typeof payload.data.message !== "string"
    ) {
      throw new Error("Failed data validation check");
    }

    return {
      opcode,
      data: {
        user: "user" in payload.data ? payload.data.user : undefined,
        message: new Uint8Array(Buffer.from(payload.data.message, "hex").buffer),
      },
    } as ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE>;
  }

  const { success, data } = ClientValidation[opcode].safeParse(payload?.data);
  if (!success) throw new Error("Failed data validation check");

  return { opcode, data } as ClientOpcodeAndDatas;
}

export function decodeJsonServer(payload: { opcode: number; data: unknown }) {
  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE) {
    return {
      opcode: payload.opcode,
      data: new Uint8Array(Buffer.from(payload?.data as string, "hex").buffer),
    } as ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE>;
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE) {
    const data = payload.data as { user: string; message: string };
    return {
      opcode: payload.opcode,
      data: {
        user: data.user,
        message: new Uint8Array(Buffer.from(data.message as string, "hex").buffer),
      },
    } as ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>;
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    const data = payload.data as { fromUser: string; toUser: string; message: string };
    return {
      opcode: payload.opcode,
      data: {
        fromUser: data.fromUser,
        toUser: data.toUser,
        message: new Uint8Array(Buffer.from(data.message as string, "hex").buffer),
      },
    } as ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE>;
  }

  return { opcode: payload.opcode, data: payload.data } as ServerOpcodeAndDatas;
}

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}
