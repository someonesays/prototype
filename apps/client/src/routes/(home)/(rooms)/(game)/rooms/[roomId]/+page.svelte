<script>
import { onMount } from "svelte";
import { page } from "$app/stores";
import { goto } from "$app/navigation";
import { launcherMatchmaking } from "$lib/components/stores/launcher";

import RoomContainer from "$lib/components/pages/RoomContainer.svelte";

onMount(() => {
  const roomId = $page.params.roomId;
  if (!$launcherMatchmaking) return goto(roomId === "new" ? "/" : `/join/${encodeURIComponent(roomId)}`);
});
</script>
  
{#if $launcherMatchmaking}
  <RoomContainer />
{/if}
