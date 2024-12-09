<script>
import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { onMount } from "svelte";

let transformScale = $state(1);

onMount(() => {
  const resize = () => {
    if (window.innerWidth >= 1100 && window.innerHeight >= 660) {
      transformScale = Math.min(window.innerWidth / 1100, window.innerHeight / 660);
    } else {
      transformScale = 1;
    }
  };
  window.addEventListener("resize", resize);
  resize();

  return () => {
    window.removeEventListener("resize", resize);
  };
});
</script>
  
<main class="misc-container">
  <BaseCard style="width: 100%; max-width: 600px; transform: scale({transformScale});">
    <p><a class="url" href="/">Back</a></p>

    <h1>Privacy Policy - Someone Says</h1>
    <h2>Effective Date: [date here]</h2>

    <p>This is where the Privacy Policy should be written!</p>
  </BaseCard>
</main>
