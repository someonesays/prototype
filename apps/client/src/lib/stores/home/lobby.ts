import { colors, shapes } from "$lib/utils/avatars";
import { getCookie } from "$lib/utils/cookies";
import { writable } from "svelte/store";

export let displayName = writable<string | null>(null);
export let shape = writable<string>(getCookie("shape") || shapes[Math.floor(Math.random() * shapes.length)]);
export let color = writable<string>(getCookie("color") || colors[Math.floor(Math.random() * colors.length)]);

export let roomIdToJoin = writable<string | null>(null);
export let kickedReason = writable<string | null>(null);
