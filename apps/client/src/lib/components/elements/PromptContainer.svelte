<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";

import { onMount } from "svelte";
import type { Visibility } from "@/public";

let container: HTMLDivElement;
let authorText = "Someone";
let promptText = "";
let promptTextOpacity = 0;

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
      author: {
        name: string;
      };
      url: string;
      createdAt: string;
      updatedAt: string;
    };

    authorText = prompt.author.name;
    promptText = prompt.prompt;
    promptTextOpacity = 1;

    iframe.src = prompt.url;
  })();

  return () => {
    container.removeChild(iframe);
  };
});
</script>

<div class="prompt-container">
  <div class="prompt-row">
    <div class="prompt-text" style="opacity:{promptTextOpacity}">
      <p>{authorText} says <b>{promptText}</b></p>
    </div>
  </div>
  <div class="prompt-iframe" bind:this={container} />
  <div class="prompt-settings">
    <div><GearIcon /></div>
  </div>
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
    font-size: calc(16px + 0.5vh);
  }
  .prompt-text {
    opacity: 0;
    text-align: center;
    padding: 12px;
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
  .prompt-settings {
    position: absolute;
    background-color: #343a40;
    color: white;
    border: 2px #4a5259 solid;
    border-radius: calc(4px + 0.5vh);
    box-shadow: #64646f33 0px 7px 29px 0px;
    cursor: pointer;
    right: calc(16px + 0.5vh);
    bottom: calc(16px + 0.5vh);
    width: calc(40px + 0.5vh);
    height: calc(40px + 0.5vh);
    transition: box-shadow .5s ease-out;
  }
  .prompt-settings:hover {
    background-color: #4a5259;
    box-shadow: #64646f73 0px 7px 29px 0px;
  }
  .prompt-settings div {
    margin: 25%;
    width: 50%;
    height: 50%;
    transition: transform .5s ease-out;
  }
  .prompt-settings:hover > div {
    transform: rotate(90deg);
  }
</style>
