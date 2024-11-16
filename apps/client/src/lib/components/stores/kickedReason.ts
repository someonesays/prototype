import { writable } from "svelte/store";

export let kickedReason = writable<string | null>(null);
