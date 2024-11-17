import { writable } from "svelte/store";
import { DiscordSDK } from "@discord/embedded-app-sdk";

export let launcher = writable<"normal" | "discord">("normal");
export let launcherDiscordSdk = writable<DiscordSDK | null>(null);
