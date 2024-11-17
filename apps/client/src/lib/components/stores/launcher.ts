import { writable } from "svelte/store";

export let launcher = writable<"normal" | "discord">("normal");
