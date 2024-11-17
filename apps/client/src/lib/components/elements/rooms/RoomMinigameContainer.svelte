<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";

import { onMount } from "svelte";
import { ParentSdk, MinigameOpcodes, ClientOpcodes } from "@/public";

import { room, roomWs } from "$lib/components/stores/roomState";

let container: HTMLDivElement;
let authorText = $state("Someone");
let minigamePromptText = $state("");
let minigameTextOpacity = $state(0);
let volumeValue = $state(100);

let isSettingsOpen = $state(false);

onMount(() => {
  if (!$room?.minigame) throw new Error("Missing room or minigame");

  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-forms");
  container.appendChild(iframe);

  const sdk = new ParentSdk({ iframe });

  // TODO: Make sure to get states from events and save ready EVEN when the player isn't ready!!

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
        host: "mock_user_id",
        state: null,
      },
      players: [
        {
          id: "mock_user_id",
          displayName: "mock display name",
          ready: false,
          points: 0,
          state: null,
        },
      ],
    });
  });

  authorText = $room.minigame.author.name;
  minigamePromptText = $room.minigame.prompt;
  minigameTextOpacity = 1;

  iframe.src = $room.minigame.url;

  return () => {
    sdk.destroy();
    container.removeChild(iframe);
  };
});

function leaveOrEndGame() {
  if ($room && $room.room.host === $room.user) {
    return $roomWs?.send({
      opcode: ClientOpcodes.MinigameEndGame,
      data: {},
    });
  }
  return $roomWs?.close();
}
</script>

<div class="minigame-container">
  <div class="minigame-row">
    <div class="minigame-text" style="opacity:{minigameTextOpacity}">
      <p>{authorText} says <b>{minigamePromptText}</b></p>
    </div>
  </div>
  <div class="minigame-iframe" bind:this={container}></div>
  <div class="minigame-settings">
    <div class="minigame-settings-menu" class:minigame-settings-menu-active={isSettingsOpen}>
      <div>
        <div>
          <p class="volume-text-left">Volume</p>
          <p class="volume-text-right">{volumeValue}%</p>
        </div>
        <br>
        <input class="volume-slider" type="range" min="0" max="100" bind:value={volumeValue} />
        <br>
        <button class="leave-button" onclick={() => leaveOrEndGame()}>
          {#if $room && $room.room.host === $room.user}
            End minigame
          {:else}
            Leave room
          {/if}
        </button>
      </div>
    </div>
    <button class="minigame-settings-button" class:minigame-settings-button-active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen}>
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
  }
  .volume-text-left {
    float: left;
  }
  .volume-text-right {
    float: right;
  }
  .minigame-settings-button {
    background-color: var(--settings-button);
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
    cursor: ew-resize;
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
    .volume-slider {
      --slider_colormix: var(--slider_activecolor);
    }
  }
  .leave-button {
    background-color: var(--error-button);
    color: var(--secondary);
    cursor: pointer;
    border: none;
    border-radius: 5px;
    margin-top: 8px;
    padding: 10px;
    width: 100%;
  }
  .leave-button:hover {
    background-color: var(--error-button-hover);
  }
  @media (hover: hover) {
    .minigame-settings-button:hover {
      background-color: #4a5259;
      box-shadow: #64646f73 0px 7px 29px 0px;
    }
    .minigame-settings-button:hover > div {
      transform: rotate(90deg);
    }
  }
</style>
