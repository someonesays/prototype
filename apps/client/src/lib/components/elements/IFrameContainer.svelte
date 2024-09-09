<script lang="ts">
import { onMount } from "svelte";
import type { Visibility } from "@/public";

let container: HTMLDivElement;
let promptText = "";

onMount(() => {
  const promptId = "1";

  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-forms");

  container.appendChild(iframe);

  (async () => {
    const prompt = (await (await fetch(`/api/prompts/${promptId}`)).json()) as {
      id: string;
      visibility: Visibility;
      prompt: string;
      url: string;
      createdAt: string;
      updatedAt: string;
    };

    promptText = prompt.prompt;
    iframe.src = prompt.url;
  })();

  return () => {
    container.removeChild(iframe);
  };
});
</script>

<div class="prompt-container">
  <div class="prompt-row">
    <p class="prompt-text">Someone says <b>{promptText}</b></p>
  </div>
  <div class="prompt-iframe" bind:this={container} />
</div>

<style>
  .prompt-container {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    flex-flow: column;
    align-items: stretch;
    overflow: hidden;
  }
  .prompt-row {
    background-color: black;
    color: white;
    text-align: center;
    font-size: calc(16px + 0.5vh);
  }
  .prompt-iframe {
    background-color: black;
    flex: 1 1 auto;
  }
  :global(.prompt-iframe iframe) {
    border-width: 0;
    width: 100%;
    height: 100%;
  }
</style>
