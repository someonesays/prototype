<script lang="ts">
import { onMount } from "svelte";
import { ParentSdk, MinigameOpcodes } from "@/sdk";

import "$lib/styles/fonts/cascadiaCode.css";
import "$lib/styles/fonts/virgil.css";

import GearIcon from "$lib/components/icons/GearIcon.svelte";

export let minigameId: string;

let container: HTMLDivElement;
let authorText = "Someone";
let minigamePromptText = "";
let minigameTextOpacity = 0;
$: volumeValue = 100;

onMount(() => {
  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-forms");
  container.appendChild(iframe);

  const sdk = new ParentSdk({ iframe });

  sdk.once(MinigameOpcodes.Handshake, () => {
    sdk.confirmHandshake({
      // TODO: Remove these placeholder messages
      started: false,
      settings: {
        language: "en-US",
        volume: 1,
      },
      user: "mock_user_id",
      room: {
        name: "mock room name",
        host: "mock_user_id",
        state: null,
      },
      players: [
        {
          id: "mock_user_id",
          displayName: "mock display name",
          ready: false,
          state: null,
        },
      ],
    });
  });

  (async () => {
    // TODO: Stop using getMinigame() and use data from WebSocket instead.
    const { success, minigame } = await ParentSdk.getMinigame(minigameId);
    if (!success || !minigame) throw new Error("The minigame with the given ID doesn't exist");

    authorText = minigame.author.name;
    minigamePromptText = minigame.prompt;
    minigameTextOpacity = 1;

    iframe.src = minigame.url;
  })();

  return () => {
    sdk.destroy();
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

<div class="minigame-container">
  <div class="minigame-row">
    <div class="minigame-text" style="opacity:{minigameTextOpacity}">
      <p>{authorText} says <b>{minigamePromptText}</b></p>
    </div>
  </div>
  <div class="minigame-iframe" bind:this={container} />
  <div class="minigame-settings">
    <div class="minigame-settings-menu" class:minigame-settings-menu-active={isSettingsOpen}>
      <div>
        <div>
          <p class="volume-text-left">Volume</p>
          <p class="volume-text-right">{volumeValue}%</p>
        </div>
        <br>
        <input class="volume-slider" type="range" min="0" max="100" bind:value={volumeValue} />
      </div>
      <div>
        <button class="leave-game" on:click={leaveGame}>Leave game</button>
      </div>
    </div>
    <button class="minigame-settings-button" class:minigame-settings-button-active={isSettingsOpen} on:click={openSettings}>
      <div><GearIcon /></div>
    </button>
  </div>
</div>

<style>
  .minigame-container {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    flex-flow: column;
    align-items: stretch;
    overflow: hidden;
  }
  .minigame-row {
    background-color: black;
    color: white;
  }
  .minigame-text {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(4px + 0.5vh);
    opacity: 0;
    text-align: center;
    height: calc(40px + 0.5vh);
    max-height: calc(40px + 0.5vh);
    font-size: calc(16px + 0.25vh);
  }
  .minigame-iframe {
    background-color: black;
    flex: 1 1 auto;
  }
  :global(.minigame-iframe iframe) {
    border-width: 0;
    width: 100%;
    height: 100%;
  }
  .minigame-settings {
    position: absolute;
    color: white;
    right: calc(16px + 0.5vh);
    bottom: calc(16px + 0.5vh);
  }
  .minigame-settings-menu {
    display: none;
    margin-bottom: 12px;
  }
  .minigame-settings-menu p {
    margin: 0;
  }
  .minigame-settings-menu-active {
    display: block;
    border-radius: 2px;
    background-color: #1e1e1e;
    box-shadow: #64646f33 0px 7px 29px 0px;
    padding: 18px 12px;
    width: 250px;
    font-size: 16px;
    font-family: 'Cascadia Code', sans-serif;
  }
  .volume-text-left {
    float: left;
  }
  .volume-text-right {
    float: right;
  }
  .minigame-settings-button {
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
  .minigame-settings-button div {
    margin: 25%;
    width: 50%;
    height: 50%;
    transition: transform .5s ease-out;
  }
  .minigame-settings-button-active {
    background-color: #4a5259;
  }
  .volume-slider {
    --slider_activecolor: #1971c2;
    --slider_linethickness: 4px;
    --slider_thumbsize: 16px;
    --slider_colormix: color-mix(in srgb, var(--slider_activecolor), #000 var(--slider_mixpercentage, 0%));

    margin-top: 8px;
    width: 100%;
    height: var(--slider_thumbsize);
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: none;
    cursor: pointer;
    overflow: hidden;
  }
  .volume-slider:focus-visible,
  .volume-slider:hover {
    --slider_mixpercentage: 25%;
  }
  .volume-slider[type="range" i]::-webkit-slider-thumb {
    height: var(--slider_thumbsize);
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: 0 0 0 var(--slider_thumbsize, var(--slider_linethickness)) inset var(--slider_colormix);
    border-image: linear-gradient(90deg, var(--slider_colormix) 50%, #ababab 0) 0 1/calc(50% - var(--slider_linethickness)/2) 100vw/0px calc(100vw);
    -webkit-appearance: none;
    appearance: none;
  }
  .volume-slider[type="range"]::-moz-range-thumb {
    height: var(--slider_thumbsize);
    width: var(--slider_thumbsize);
    background: none;
    border-radius: 50%;
    box-shadow: 0 0 0 var(--slider_thumbsize, var(--slider_linethickness)) inset var(--slider_colormix);
    border-image: linear-gradient(90deg, var(--slider_colormix) 50%, #ababab 0) 0 1/calc(50% - var(--slider_linethickness)/2) 100vw/0 calc(100vw);
    -moz-appearance: none;
    appearance: none;
  }
  @supports not (color: color-mix(in srgb, red, red)) {
    input {
      --slider_colormix: var(--slider_activecolor);
    }
  }
  .leave-game {
    border: 2px #e03131 solid;
    border-radius: 6px;
    background-color: #ffc9c9;
    color: #e03131;
    text-align: right;
    cursor: pointer;
    margin-top: 12px;
    width: 100%;
    height: 36px;
    padding: 0px 12px;
    font-size: 16px;
    font-family: 'Virgil', sans-serif;
    transition: border .5s ease-out;
  }
  @media (hover: hover) {
    .minigame-settings-button:hover {
      background-color: #4a5259;
      box-shadow: #64646f73 0px 7px 29px 0px;
    }
    .minigame-settings-button:hover > div {
      transform: rotate(90deg);
    }
    .leave-game:hover {
      background-color: #e03131;
      color: #ffc9c9;
    }
  }
</style>
