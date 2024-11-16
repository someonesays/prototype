import { writable } from "svelte/store";

export let displayName = writable<string | null>(null);
