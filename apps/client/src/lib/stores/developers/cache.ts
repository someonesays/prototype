import { writable } from "svelte/store";
import { getCookie } from "$lib/utils/cookies";
import type { ApiGetUserMe } from "@/public";

export const user = writable<ApiGetUserMe["user"] | null>(null);
export const token = writable<string>(getCookie("token") ?? "");
