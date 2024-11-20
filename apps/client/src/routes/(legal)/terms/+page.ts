import { parseMd } from "$lib/utils/parseMd";

export async function load({ fetch }) {
  return {
    termsHtml: parseMd(await (await fetch("/legal/terms.txt")).text()),
  };
}
