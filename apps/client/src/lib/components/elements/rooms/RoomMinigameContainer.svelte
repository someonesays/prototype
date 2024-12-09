<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";
import DoorOpen from "$lib/components/icons/DoorOpen.svelte";
import Plug from "$lib/components/icons/Plug.svelte";

import Modal from "../cards/Modal.svelte";

import { onMount } from "svelte";
import { ParentSdk, MinigameOpcodes, ClientOpcodes, GameStatus } from "@/public";

import {
  room,
  roomWs,
  roomHandshakeCount,
  roomRequestedToLeave,
  roomParentSdk,
  roomMinigameReady,
  roomJoinedLate,
} from "$lib/components/stores/roomState";
import { volumeValue } from "$lib/components/stores/settings";
import { launcher } from "$lib/components/stores/launcher";
import { isModalOpen } from "$lib/components/stores/modal";

let container: HTMLDivElement;
let isSettingsOpen = $state(false);
let isEnding = $state(false);

let transformScale = $state(1);

onMount(() => {
  if (!$room?.minigame) throw new Error("Missing room or minigame");

  // Add resizing

  const resize = () => {
    if (window.innerWidth >= 1100 && window.innerHeight >= 660) {
      transformScale = Math.min(window.innerWidth / 1100, window.innerHeight / 660);
    } else {
      transformScale = 1;
    }
  };
  window.addEventListener("resize", resize);
  resize();

  // Handle iframe and SDK

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
      data: {
        roomHandshakeCount: $roomHandshakeCount,
      },
    });
  });
  sdk.on(MinigameOpcodes.END_GAME, (evt) => {
    if ($room.user !== $room.room.host) throw new Error("Only the host can end the game");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_END_GAME,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SET_GAME_STATE, (evt) => {
    if ($room.user !== $room.room.host) throw new Error("Only the host can set the game state");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SET_GAME_STATE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SET_PLAYER_STATE, (evt) => {
    if ($room.user !== $room.room.host) throw new Error("Only the host a player's state");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SET_PLAYER_STATE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_GAME_MESSAGE, (evt) => {
    if ($room.user !== $room.room.host) throw new Error("Only the host can send a game message");

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
    if ($room.user !== $room.room.host && evt.user && evt.user !== $room.room.host)
      throw new Error("Only the host can send a private message to other players");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_PRIVATE_MESSAGE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_BINARY_GAME_MESSAGE, (evt) => {
    if ($room.user !== $room.room.host) throw new Error("Only the host can send a game message");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_BINARY_GAME_MESSAGE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_BINARY_PLAYER_MESSAGE, (evt) => {
    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_BINARY_PLAYER_MESSAGE,
      data: evt,
    });
  });
  sdk.on(MinigameOpcodes.SEND_BINARY_PRIVATE_MESSAGE, (evt) => {
    if ($room.user !== $room.room.host && evt.user && evt.user !== $room.room.host)
      throw new Error("Only the host can send a private message to other players");

    $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_SEND_BINARY_PRIVATE_MESSAGE,
      data: evt,
    });
  });

  if (!$room.minigame.proxies) throw new Error("Minigame 'proxies' is not defined. This should never happen.");
  iframe.src = $launcher === "normal" ? $room.minigame.proxies.normal : $room.minigame.proxies.discord;

  return () => {
    sdk.destroy();
    $roomParentSdk = null;
    $roomJoinedLate = false;
    $isModalOpen = false;
    container.removeChild(iframe);
  };
});

function leaveOrEndGame() {
  if (isEnding) return;
  $isModalOpen = true;
}

function leaveOrEndGameConfirm() {
  if ($room && $room.room.host === $room.user) {
    if (isEnding) return;
    isEnding = true;

    return $roomWs?.send({
      opcode: ClientOpcodes.MINIGAME_END_GAME,
      data: {},
    });
  }

  $roomRequestedToLeave = true;
  return $roomWs?.close();
}
</script>

<Modal style="transform: scale({transformScale});">
  <br><br>
  {#if $room && $room.room.host === $room.user}
    <div class="modal-icon"><Plug /></div>
    <p>
      Are you sure you want to end this minigame?<br>
      Points will not be awarded.
    </p>
    <p>
      <button class="leave-button {isEnding ? "loading" : ""}" onclick={leaveOrEndGameConfirm}>
        {#if isEnding}
          Ending minigame...
        {:else}
          End minigame
        {/if}
      </button>
      <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
    </p>
  {:else}
    <div class="modal-icon"><DoorOpen color="black" /></div>
    <p>Are you sure you want to leave the room?</p>
    <p>
      <button class="leave-button {isEnding ? "loading" : ""}" onclick={leaveOrEndGameConfirm}>Leave room</button>
      <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
    </p>
  {/if}
</Modal>

<div class="minigame-container">
  <div class="minigame-iframe-container">
    <div class="minigame-iframe" style={$roomMinigameReady && $room?.status === GameStatus.STARTED ? "" : "pointer-events:none"} bind:this={container}></div>
    <div class="minigame-notready-container {$roomMinigameReady && $room?.status === GameStatus.STARTED ? "fade" : ""}" style="transform: scale({transformScale});">
      <div class="minigame-notready-section">
        <div class="minigame-notready-scale">
          <div class="minigame-notready-box">
            <div class="loading-animation"></div>
            <div class="minigame-notready-text">
              {
                $roomMinigameReady && !$roomJoinedLate && ($room?.players.filter(p => p.ready || $room.user === p.id).length || 0) < ($room?.players.length || 0)
                  ? `Waiting for players... (${$room?.players.filter(p => p.ready).length}/${$room?.players.length})`
                  : "Loading minigame..."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="minigame-settings" style="transform: scale({transformScale});">
    <div class="settings-menu" class:active={isSettingsOpen}>
      <div>
        <div>
          <p class="volume-text-left">Volume</p>
          <p class="volume-text-right">{$volumeValue}%</p>
        </div>
        <br>
        <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} onchange={() => $roomParentSdk?.updateSettings({ settings: { volume: $volumeValue } })} />
        <br>
        {#if $launcher !== "discord" || $room && $room.room.host === $room.user}
          <button class="leave-button {isEnding ? "loading" : ""}" onclick={leaveOrEndGame}>
            {#if $room && $room.room.host === $room.user}
              {#if isEnding}
                Ending minigame...
              {:else}
                End minigame
              {/if}
            {:else}
              Leave room
            {/if}
          </button>
        {/if}
      </div>
    </div>
    <button class="button settings" class:active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen}>
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
  .minigame-notready-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .minigame-notready-scale {
    animation-name: notready-appear;
    animation-duration: 0.5s;
  }
  .minigame-notready-box {
    background-color: var(--primary);
    color: var(--secondary-text);
    border: 1px solid #242424;
    box-shadow: #00000065 0px 7px 29px 0px;
    border-radius: 6px;
    padding: 20px;
    display: flex;
    align-items: center;
    flex-direction: column;
    opacity: 1;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes notready-appear {
    0% {
      opacity: 0;
      transform: scale(0.96);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .minigame-notready-box:hover {
    transform: scale(1.04);
  }
  .minigame-notready-text {
    margin-top: 16px;
    text-align: center;
  }
  .loading-animation {
    border: 6px solid #5812e2;
    border-top: 6px solid #fafafa;
    width: 50px;
    height: 50px;
  }
  .minigame-settings {
    position: absolute;
    color: white;
    right: 18px;
    bottom: 18px;
    transform-origin: bottom right;
  }
  .settings-menu {
    margin-bottom: 12px;
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
  .leave-button.loading {
    cursor: wait;
  }
  .leave-button:hover {
    background-color: var(--error-button-hover);
  }
</style>
