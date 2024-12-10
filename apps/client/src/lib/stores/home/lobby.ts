import { writable } from "svelte/store";

export let displayName = writable<string | null>(null);
export let roomIdToJoin = writable<string | null>(null);
export let kickedReason = writable<string | null>(null);
