<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";

import { onMount } from "svelte";
import { ParentSdk, MinigameOpcodes, ClientOpcodes } from "@/public";

import { room, roomMinigameReady, roomWs, roomParentSdk } from "$lib/components/stores/roomState";
import { volumeValue } from "$lib/components/stores/settings";
import { launcher } from "$lib/components/stores/launcher";

let container: HTMLDivElement;
let isSettingsOpen = $state(false);

onMount(() => {
  if (!$room?.minigame) throw new Error("Missing room or minigame");

  const iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.referrerPolicy = "origin";
  iframe.allow = "autoplay; encrypted-media";
  iframe.sandbox.add("allow-pointer-lock", "allow-scripts", "allow-forms");
  container.appendChild(iframe);

  const sdk = new ParentSdk({ iframe });
  $roomParentSdk = sdk;

  sdk.once(MinigameOpcodes.HANDSHAKE, () => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_HANDSHAKE,
      data: {},
    });
  });
  sdk.on(MinigameOpcodes.END_GAME, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_END_GAME,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SET_GAME_STATE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SET_GAME_STATE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SET_PLAYER_STATE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SET_PLAYER_STATE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_GAME_MESSAGE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_GAME_MESSAGE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_PLAYER_MESSAGE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_PLAYER_MESSAGE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_PRIVATE_MESSAGE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE,
      data: evt,
    });
  });

  if (!$room.minigame.proxies) throw new Error("Minigame 'proxies' is not defined. This should never happen.");
  iframe.src = $launcher === "normal" ? $room.minigame.proxies.normal : $room.minigame.proxies.discord;

  return () => {
    sdk.destroy();
    $roomParentSdk = null;
    container.removeChild(iframe);
  };
});

function leaveOrEndGame() {
  if ($room && $room.room.host === $room.user) {
    return $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_END_GAME,
      data: {},
    });
  }
  return $roomWs?.close();
}
</script>

<div class="minigame-container">
  <div class="minigame-iframe-container">
    <div class="minigame-iframe" style={$roomMinigameReady ? "" : "pointer-events:none"} bind:this={container}></div>
    <div class="minigame-notready-container {$roomMinigameReady ? "fade" : ""}">
      <div class="minigame-notready">
        <div class="minigame-notready-box">
          <div class="minigame-notready-loader"></div>
          <div class="minigame-notready-text">Loading minigame...</div>
        </div>
      </div>
    </div>
  </div>
  <div class="minigame-settings">
    <div class="minigame-settings-menu" class:minigame-settings-menu-active={isSettingsOpen}>
      <div>
        <div>
          <p class="volume-text-left">Volume</p>
          <p class="volume-text-right">{$volumeValue}%</p>
        </div>
        <br>
        <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} onchange={() => $roomParentSdk?.updateSettings({ settings: { volume: $volumeValue } })} />
        <br>
        {#if $launcher !== "discord" || $room && $room.room.host === $room.user}
          <button class="leave-button" onclick={leaveOrEndGame}>
            {#if $room && $room.room.host === $room.user}
              End minigame
            {:else}
              Leave room
            {/if}
          </button>
        {/if}
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
  .minigame-iframe-container {
    background-color: black;
    flex: 1 1 auto;
  }
  .minigame-iframe {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .minigame-notready-container {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    transition: opacity .5s;
  }
  .minigame-notready-container.fade {
    opacity: 0;
    pointer-events: none;
  }
  .minigame-notready {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .minigame-notready-box {
    background-color: #313131;
    border: 1px solid #242424;
    box-shadow: #64646f65 0px 7px 29px 0px;
    border-radius: 6px;
    padding: 20px;
    display: flex;
    align-items: center;
    flex-direction: column;
    opacity: 1;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .minigame-notready-box:hover {
    transform: scale(1.06);
  }
  .minigame-notready-text {
    margin-top: 16px;
    text-align: center;
  }
  .minigame-notready-loader {
    border: 6px solid #8a5ee9;
    -webkit-animation: minigame-notready-loader-spin 1s linear infinite;
    animation: minigame-notready-loader-spin 1s linear infinite;
    animation-duration: 1.5s;
    animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
    border-top: 6px solid #fafafa;
    border-radius: 50%;
    width: 50px;
    height: 50px;
  }
  @keyframes minigame-notready-loader-spin {
    0% { 
      -webkit-transform: rotate(0deg);
      -ms-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      -ms-transform: rotate(360deg);
      transform: rotate(360deg);
    }
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
    background-color: var(--settings-button);
    border: 1px solid #242424;
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
