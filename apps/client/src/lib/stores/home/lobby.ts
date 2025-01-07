import { colors, randomColor, randomShape, shapes } from "$lib/utils/avatars";
import { getCookie } from "$lib/utils/cookies";
import { writable } from "svelte/store";

const shapeCookie = getCookie("shape");
const colorCookie = getCookie("color");

export let displayName = writable<string | null>(null);
export let shape = writable<string>(shapes.includes(shapeCookie) ? shapeCookie : randomShape());
export let color = writable<string>(colors.includes(colorCookie) ? colorCookie : randomColor());

export let roomIdToJoin = writable<string | null>(null);
export let kickedReason = writable<string | null>(null);
