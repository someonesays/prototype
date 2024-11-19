import { VITE_DISCORD_CLIENT_ID } from "$lib/utils/env";
import { goto } from "$app/navigation";

export async function load() {
  // Redirects to Discord launcher if it's [client id].discordsays.com
  if (location.origin === `https://${VITE_DISCORD_CLIENT_ID}.discordsays.com`) {
    const urlParams = new URLSearchParams(window.location.search);
    return goto(`/launchers/discord?${urlParams.toString()}`);
  }
}
