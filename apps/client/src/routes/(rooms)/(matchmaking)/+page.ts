import env from "$lib/utils/env";
import { goto } from "$app/navigation";

export async function load() {
  // Redirects to Discord launcher if it's [client id].discordsays.com
  if (location.origin === `https://${env.VITE_DISCORD_CLIENT_ID}.discordsays.com`) {
    const urlParams = new URLSearchParams(window.location.search);
    return goto(`/launchers/discord?${urlParams.toString()}`);
  }
}
