import { parseMd } from "$lib/utils/parseMd";

export async function load({ fetch }) {
  return {
    creditsHtml: parseMd(await (await fetch("/text/credits.txt")).text()),
  };
}
