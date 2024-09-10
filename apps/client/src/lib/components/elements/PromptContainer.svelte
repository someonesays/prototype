<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";

import { onMount } from "svelte";
import type { Visibility } from "@/public";

let container: HTMLDivElement;
let authorText = "Someone";
let promptText = "";
let promptTextOpacity = 0;
$: volumeValue = 100;

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

let isSettingsOpen = false;
function openSettings() {
  isSettingsOpen = !isSettingsOpen;
}

function leaveGame() {
  alert("This is an unfinished button");
}
</script>

<div class="prompt-container">
  <div class="prompt-row">
    <div class="prompt-text" style="opacity:{promptTextOpacity}">
      <p>{authorText} says <b>{promptText}</b></p>
    </div>
  </div>
  <div class="prompt-iframe" bind:this={container} />
  <div class="prompt-settings">
    <div class="prompt-settings-menu" class:prompt-settings-menu-active={isSettingsOpen}>
      <div>
        <div>
          <p style="float: left">Volume</p>
          <p style="float: right">{volumeValue}%</p>
        </div>
        <input type="range" min="0" max="100" bind:value={volumeValue} />

        
      </div>
      <div>
        <button class="leave-game" on:click={leaveGame}>Leave game</button>
      </div>
    </div>
    <button class="prompt-settings-button" class:prompt-settings-button-active={isSettingsOpen} on:click={openSettings}>
      <div><GearIcon /></div>
    </button>
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
    color: white;
    right: calc(16px + 0.5vh);
    bottom: calc(16px + 0.5vh);
  }
  .prompt-settings-menu {
    display: none;
    margin-bottom: 12px;
  }
  .prompt-settings-menu p {
    margin: 0;
  }
  .prompt-settings-menu-active {
    display: block;
    border-radius: 2px;
    background-color: #1e1e1e;
    box-shadow: #64646f33 0px 7px 29px 0px;
    padding: 15px;
  }
  .prompt-settings-button {
    background-color: #343a40;
    border: 2px #4a5259 solid;
    border-radius: calc(4px + 0.5vh);
    box-shadow: #64646f33 0px 7px 29px 0px;
    padding: 0px;
    float: right;
    cursor: pointer;
    width: calc(40px + 0.5vh);
    height: calc(40px + 0.5vh);
    transition: box-shadow .5s ease-out;
  }
  .prompt-settings-button div {
    margin: 25%;
    width: 50%;
    height: 50%;
    transition: transform .5s ease-out;
  }
  .prompt-settings-button-active {
    background-color: #4a5259;
  }
  @media (hover: hover) {
    .prompt-settings-button:hover {
      background-color: #4a5259;
      box-shadow: #64646f73 0px 7px 29px 0px;
    }
    .prompt-settings-button:hover > div {
      transform: rotate(90deg);
    }
  }
  .leave-game {
    border: 2px #e03131 solid;
    border-radius: 2px;
    background-color: #ffc9c9;
    color: #e03131;
    text-align: right;
    cursor: pointer;
    margin-top: 12px;
    width: 100%;
    height: 30px;
    transition: border .5s ease-out;
  }
  .leave-game:hover {
    background-color: #e03131;
    color: #ffc9c9;
  }
</style>
