import { decode, encode } from "@msgpack/msgpack";
import { ClientValidation, type ClientOpcodes, type ServerOpcodes, type ServerTypes } from "@/sdk";
import type z from "zod";

export function encodeClient<O extends ClientOpcodes>(payload: {
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

export function encodeServer<O extends ServerOpcodes>(payload: {
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

export function decodeClient<O extends ClientOpcodes>(
  payload: Uint8Array,
): {
  opcode: O;
  data: z.infer<(typeof ClientValidation)[O]>;
} {
  const opcode = payload[0] as O;
  if (!ClientValidation[opcode]) throw new Error("Invalid opcode recieved");
  const { success, data } = ClientValidation[opcode].safeParse(decode(payload.slice(1)));
  if (!success) throw new Error("Failed data validation check");
  return { opcode, data };
}

export function decodeServer<O extends ServerOpcodes>(
  payload: Uint8Array,
): {
  opcode: O;
  data: ServerTypes[O];
} {
  return { opcode: payload[0] as O, data: decode(payload.slice(1)) as ServerTypes[O] };
}
