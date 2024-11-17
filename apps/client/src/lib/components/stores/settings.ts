import { getCookie, setCookie } from "$lib/utils/cookies";
import { writable } from "svelte/store";

const cookieVolume = Number.parseInt(getCookie("volume"));
export let volumeValue = writable<number>(!cookieVolume || cookieVolume < 0 || cookieVolume > 100 ? 100 : cookieVolume);

volumeValue.subscribe((value) => {
  setCookie("volume", value.toString());
});
