import { decode, encode } from "@msgpack/msgpack";
import {
  ClientValidation,
  type ClientOpcodes,
  type ClientOpcodeAndDatas,
  type ServerOpcodes,
  type ServerTypes,
  type ServerOpcodeAndDatas,
} from "@/sdk";
import type z from "zod";

export function encodeOppackClient<O extends ClientOpcodes>(payload: {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
}) {
  const { opcode, data } = payload;
  const encoded = encode(data);
  const buffer = new Uint8Array(encoded.length + 1);
  buffer[0] = opcode;
  buffer.set(encoded, 1);
  return buffer;
}

export function encodeOppackServer<O extends ServerOpcodes>(payload: {
  opcode: O;
  data: ServerTypes[O];
}) {
  const { opcode, data } = payload;
  const encoded = encode(data);
  const buffer = new Uint8Array(encoded.length + 1);
  buffer[0] = opcode;
  buffer.set(encoded, 1);
  return buffer;
}

export function decodeOppackClient(payload: Uint8Array) {
  const opcode = payload[0] as ClientOpcodes;
  if (!ClientValidation[opcode]) throw new Error("Invalid opcode recieved");
  const { success, data } = ClientValidation[opcode].safeParse(decode(payload.slice(1)));
  if (!success) throw new Error("Failed data validation check");
  return { opcode, data } as ClientOpcodeAndDatas;
}

export function decodeOppackServer(payload: Uint8Array) {
  return { opcode: payload[0], data: decode(payload.slice(1)) } as ServerOpcodeAndDatas;
}
