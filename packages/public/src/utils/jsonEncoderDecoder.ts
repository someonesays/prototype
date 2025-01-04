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
      data: [toHexString(data[0]), data[1]],
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
    return JSON.stringify({ opcode: payload.opcode, data: toHexString(payload.data) });
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE) {
    const data = payload.data as ServerTypes[ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE];
    return JSON.stringify({ opcode: payload.opcode, data: [data[0], toHexString(data[1])] });
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    const data = payload.data as ServerTypes[ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE];
    return JSON.stringify({ opcode: payload.opcode, data: [data[0], data[1], toHexString(data[2])] });
  }

  return JSON.stringify({ opcode: payload.opcode, data: payload.data });
}

export function decodeJsonClient(payload: { opcode: number; data: unknown }) {
  const opcode = Number(payload?.opcode) as ClientOpcodes;
  if (!ClientValidation[opcode]) throw new Error("Invalid opcode recieved");

  if (
    [ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE, ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE].includes(opcode)
  ) {
    if (typeof payload !== "string") throw new Error("Failed data validation check");
    return {
      opcode,
      data: new Uint8Array(Buffer.from(payload, "hex").buffer),
    } as
      | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE>
      | ClientOpcodeAndData<ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>;
  }

  if (opcode === ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    if (
      !Array.isArray(payload?.data) ||
      !payload.data[0] ||
      typeof payload.data[0] !== "string" ||
      (payload.data[1] &&
        (typeof payload.data[1] !== "number" ||
          payload.data[1] !== Math.floor(payload.data[1]) ||
          payload.data[1] < 0 ||
          payload.data[1] > 99))
    ) {
      throw new Error("Failed data validation check");
    }

    return {
      opcode,
      data: [new Uint8Array(Buffer.from(payload.data[0], "hex").buffer), payload.data[1] ?? null],
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
    const data = payload.data as [number, string];
    return {
      opcode: payload.opcode,
      data: [data[0], new Uint8Array(Buffer.from(data[1] as string, "hex").buffer)],
    } as ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE>;
  }

  if (payload.opcode === ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE) {
    const data = payload.data as [number, number, string];
    return {
      opcode: payload.opcode,
      data: [data[0], data[1], new Uint8Array(Buffer.from(data[2] as string, "hex").buffer)],
    } as ServerOpcodeAndData<ServerOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE>;
  }

  return { opcode: payload.opcode, data: payload.data } as ServerOpcodeAndDatas;
}

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}
