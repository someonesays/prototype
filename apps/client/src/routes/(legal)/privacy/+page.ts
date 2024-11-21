import { parseMd } from "$lib/utils/parseMd";

export async function load({ fetch }) {
  return {
    privacyHtml: parseMd(await (await fetch("/text/privacy.txt")).text()),
  };
}
