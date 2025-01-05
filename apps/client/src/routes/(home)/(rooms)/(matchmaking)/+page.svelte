<script>
import HomeContainer from "$lib/components/pages/HomeContainer.svelte";

import { page } from "$app/state";
import { onMount } from "svelte";
import { launcherMatchmaking } from "$lib/stores/home/launcher";
import { roomMinigameIdOnJoin } from "$lib/stores/home/roomState";

onMount(() => {
  const minigameId = page.url.searchParams.get("minigame");
  if (typeof minigameId === "string" && minigameId.length >= 1 && minigameId.length <= 50) {
    $roomMinigameIdOnJoin = minigameId;
    return () => {
      if ($launcherMatchmaking) return;
      $roomMinigameIdOnJoin = null;
    };
  }
});
</script>

<HomeContainer />
