<script lang="ts">
import { onMount } from "svelte";

let container: HTMLDivElement;

onMount(() => {
  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.classList.add("iframe");
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-same-origin", "allow-forms");

  iframe.src = "https://example.com/";
  container.appendChild(iframe);

  return () => {
    container.removeChild(iframe);
  };
});
</script>

<div bind:this={container}/>

<style>
  .iframe {
    width: 100%;
    height: 100%;
    min-width: 2px;
    min-height: 2px;
  }
</style>