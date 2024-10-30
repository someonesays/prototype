<script lang="ts">
import MinigameContainer from "$lib/components/elements/MinigameContainer.svelte";

// TODO: Add a warning if you try to navigate out of the page
/*
  import { beforeNavigate } from "$app/navigation";

  beforeNavigate(({ cancel }) => {
    cancel();
  });
*/
</script>
  
<main>
  <MinigameContainer minigameId="1" />
</main>
