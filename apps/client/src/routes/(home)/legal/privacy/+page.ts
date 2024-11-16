import { parseMd } from "$lib/utils/parseMd";

export async function load({ fetch }) {
  return {
    privacyHtml: await parseMd(await (await fetch("/legal/privacy.txt")).text()),
  };
}
