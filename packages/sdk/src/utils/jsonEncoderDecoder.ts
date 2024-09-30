import {
  ClientValidation,
  type ServerOpcodes,
  type ClientOpcodes,
  type ServerTypes,
  type ClientOpcodeAndDatas,
  type ServerOpcodeAndDatas,
} from "@/sdk";
import type z from "zod";

export function encodeJsonClient<O extends ClientOpcodes>(payload: {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}) {
  return JSON.stringify({
    opcode: payload.opcode,
    data: payload.data,
  });
}

export function encodeJsonServer<O extends ServerOpcodes>(payload: {
  opcode: O;
  data: ServerTypes[O];
}) {
  return JSON.stringify({
    opcode: payload.opcode,
    data: payload.data,
  });
}

export function decodeJsonClient(payload: { opcode: number; data: unknown }) {
  const opcode = Number(payload?.opcode) as ClientOpcodes;
  if (!ClientValidation[opcode]) throw new Error("Invalid opcode recieved");
  const { success, data } = ClientValidation[opcode].safeParse(payload?.data);
  if (!success) throw new Error("Failed data validation check");
  return { opcode, data } as ClientOpcodeAndDatas;
}

export function decodeJsonServer(payload: { opcode: number; data: unknown }) {
  return { opcode: payload.opcode, data: payload.data } as ServerOpcodeAndDatas;
}
