<script>
import "$lib/styles/index.css";

import { onMount } from "svelte";
import { preloadCode } from "$app/navigation";
import { page } from "$app/state";

onMount(() => {
  // Don't preload all routes in Discord activity
  if (page.url.pathname === "/launchers/discord") return;

  // Preload all routes

  preloadCode("/rooms/[roomId]");
  preloadCode("/join/[roomId]");

  preloadCode("/");

  preloadCode("/developers");
  preloadCode("/developers/settings");
  preloadCode("/developers/minigames/[id]");

  preloadCode("/auth/discord");

  preloadCode("/credits");
  preloadCode("/terms");
  preloadCode("/privacy");
});
</script>

<svelte:head>
  <title>Someone Says</title>
</svelte:head>

<slot />

<style>
  :global(html) {
    opacity: 1;
  }
</style>
