<script>
import "$lib/styles/index.css";

import { onMount } from "svelte";
import { preloadData } from "$app/navigation";

onMount(() => {
  // Preload all routes

  preloadData("/rooms/[roomId]");
  preloadData("/join/[roomId]");

  preloadData("/");

  preloadData("/developers");
  preloadData("/developers/minigames/[id]");
  preloadData("/developers/packs/[id]");

  preloadData("/auth/discord");

  preloadData("/credits");
  preloadData("/terms");
  preloadData("/privacy");
});
</script>

<svelte:head>
  <title>Someone Says</title>
</svelte:head>

<slot />
