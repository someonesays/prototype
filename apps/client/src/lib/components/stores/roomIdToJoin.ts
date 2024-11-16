import { writable } from "svelte/store";

export let roomIdToJoin = writable<string | null>(null);
