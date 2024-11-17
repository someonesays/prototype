import { writable } from "svelte/store";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { APIMatchmakingResponse } from "@/public";

export let launcher = writable<"normal" | "discord">("normal");
export let launcherMatchmaking = writable<APIMatchmakingResponse | null>(null);

export let launcherDiscordSdk = writable<DiscordSDK | null>(null);
