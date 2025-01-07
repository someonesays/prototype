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
  <BaseCard style="width: 100%; max-width: 600px; text-align: center; transform: scale({transformScale});">
    <p><a class="url" href="/">Back</a></p>
  
    <h2>Credits</h2>
    <div>
      <b>Developer</b><br>
      Two (<a class="url" href="https://github.com/real2two" target="_blank">https://github.com/real2two</a>)<br>
      <br>
      <b>Logo Designer</b><br>
      Realmy (<a class="url" href="https://realmy.net/" target="_blank">https://realmy.net/</a>)
    </div>
  
    <h2>External assets used</h2>
    <div>
      Figtree: <a class="url" href="https://www.erikdkennedy.com/projects/figtree.html" target="_blank">https://www.erikdkennedy.com/projects/figtree.html</a>
    </div>
    <div>
      Fontawesome: <a class="url" href="https://fontawesome.com/" target="_blank">https://fontawesome.com/</a>
    </div>

    <h3>Sounds</h3>
    <div>
      "press.mp3" sampled from "DSGNSynth_bubble pops synth singular_Funky Audio_FASS.wav" by Funky_Audio of freesound.org:
      <a class="url" href="https://freesound.org/people/Funky_Audio/sounds/698818/" target="_blank">https://freesound.org/people/Funky_Audio/sounds/698818/</a>
    </div>
    <div>
      "close.mp3" sampled from "DM_FX_close" by amitYunger123 of freesound.org:
      <a class="url" href="https://freesound.org/people/amitYunger123/sounds/737638/" target="_blank">https://freesound.org/people/amitYunger123/sounds/737638/</a>
    </div>
    <div>
      "start.mp3" sampled from "New bubble pulse.WAV" by metrostock99 of freesound.org:
      <a class="url" href="https://freesound.org/people/metrostock99/sounds/345081/" target="_blank">https://freesound.org/people/metrostock99/sounds/345081/</a>
    </div>
    <br>
  </BaseCard>
</main>
