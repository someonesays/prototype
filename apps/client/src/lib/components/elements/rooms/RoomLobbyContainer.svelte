<script lang="ts">
import { onMount } from "svelte";

import Logo from "$lib/components/icons/Logo.svelte";
import GearIcon from "$lib/components/icons/GearIcon.svelte";
import DoorOpen from "$lib/components/icons/DoorOpen.svelte";
import TriangleExclamation from "$lib/components/icons/TriangleExclamation.svelte";
import Crown from "$lib/components/icons/Crown.svelte";

import Modal from "../cards/Modal.svelte";

import { volumeValue } from "$lib/components/stores/settings";
import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import {
  room,
  roomWs,
  roomRequestedToChangeSettings,
  roomRequestedToStartGame,
  roomRequestedToLeave,
  roomLobbyErrorMessage,
} from "$lib/components/stores/roomState";
import { isModalOpen } from "$lib/components/stores/modal";

import { ClientOpcodes, ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let isSettingsOpen = $state(false);
let activeView = $state<"players" | "minigame">("minigame");

onMount(() => {
  $roomRequestedToChangeSettings = false;
  $roomRequestedToStartGame = false;

  return () => {
    $isModalOpen = false;
  };
});

function setSettings(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  $roomRequestedToChangeSettings = true;

  const form = new FormData(evt.target as HTMLFormElement);
  const packId = (form.get("pack_id") as string) || null;
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: {
      packId,
      minigameId,
    },
  });
}

function kickPlayer(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.KICK_PLAYER,
    data: { user },
  });
}

function transferHost(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.TRANSFER_HOST,
    data: { user },
  });
}

async function copyInviteLink() {
  try {
    switch ($launcher) {
      case "normal": {
        navigator.clipboard.writeText(`${location.origin}/join/${$room?.room.id}`);
        break;
      }
      case "discord": {
        if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");

        const { permissions } = await $launcherDiscordSdk.commands.getChannelPermissions();
        if (PermissionUtils.can(Permissions.CREATE_INSTANT_INVITE, permissions)) {
          await $launcherDiscordSdk.commands.openInviteDialog();
        } else {
          console.warn("User doesn't have CREATE_INSTANT_INVITE permissions!");
        }

        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function startGame() {
  if (!$room?.minigame) {
    $roomLobbyErrorMessage = ErrorMessageCodesToText[ErrorMessageCodes.WS_CANNOT_START_WITHOUT_MINIGAME];
    $isModalOpen = true;
    return;
  }

  $roomRequestedToStartGame = true;
  $roomWs?.send({ opcode: ClientOpcodes.BEGIN_GAME, data: {} });
}

function leaveGame() {
  $roomRequestedToLeave = true;
  return $roomWs?.close();
}
</script>

<Modal>
  <div style="width: 80px; margin: 0 auto;"><TriangleExclamation /></div>
  <p>{$roomLobbyErrorMessage}</p>
  <p><button class="secondary-button" onclick={() => $isModalOpen = false}>Close</button></p>
</Modal>

<div class="app-container">
  <div class="content-container">
    <div class="nav-container">
      <div class="left">
        {#if $launcher === "normal"}
          <button class="button leave" onclick={leaveGame}>
            <div><DoorOpen /></div>
          </button>
        {:else}
          <div class="logo">
            <Logo />
          </div>
        {/if}
      </div>
      <div class="center">
        {#if $launcher === "normal"}
          <div class="logo main">
            <Logo />
          </div>
        {/if}
        <div class="view-container">
          <button class:active={activeView === 'minigame'} onclick={() => activeView = "minigame"}>Minigame</button>
          <button class:active={activeView === 'players'} onclick={() => activeView = "players"}>Players</button>
        </div>
      </div>
      <div class="right">
        <button class="button settings" class:active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen}>
          <div><GearIcon /></div>
        </button>
        <div class="settings-menu" class:active={isSettingsOpen}>
          <div>
            <div>
              <p class="volume-text-left">Volume</p>
              <p class="volume-text-right">{$volumeValue}%</p>
            </div>
            <br>
              <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} />
            </div>
          </div>
        </div>
    </div>
    <div class="main-container">
      <div class="card left players-container" class:hidden={activeView !== 'players'}>
        <h2 class="center">Players</h2>
        {#if $room}
          {#each $room.players as player}
            <div>
              <img src={player.avatar} width="50" height="50" alt="{player.displayName}'s avatar" />
              {player.displayName}{#if $room.room.host === player.id}&#160;<Crown />{/if}

              {player.points} point{player.points === 1 ? "": "s"}
              
              {#if $room.room.host === $room.user && $room.user !== player.id}
                <button onclick={() => kickPlayer(player.id)}>
                  Kick
                </button>
                <button onclick={() => transferHost(player.id)}>
                  Transfer Host
                </button>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
      <div class="minigame-container card right" class:hidden={activeView !== 'minigame'}>
        {#if $room}
          <h2>Minigame information</h2>
          <p>Pack: {$room.pack ? JSON.stringify($room.pack) : "None"}</p>
          <p>Minigame: {$room.minigame ? JSON.stringify($room.minigame) : "None"}</p>
          
          {#if $room.pack?.iconImage}
            <p>Pack icon image:</p>
            <p>
              <img alt="pack preview" src={
                $launcher === "normal"
                  ? $room.pack.iconImage.normal
                  : $room.pack.iconImage.discord
              } width="100" height="100" />
            </p>
          {/if}
                  
          {#if $room.minigame?.previewImage}
            <p>Minigame preview image:</p>
            <p>
              <img alt="minigame preview" src={
                $launcher === "normal"
                  ? $room.minigame.previewImage.normal
                  : $room.minigame.previewImage.discord
              } width="100" height="100" />
            </p>
          {/if}

          {#if $room.room.host === $room.user}
            <form onsubmit={setSettings}>
              <input type="text" name="pack_id" placeholder="Pack ID" disabled={$roomRequestedToChangeSettings}>
              <input type="text" name="minigame_id" placeholder="Minigame ID" disabled={$roomRequestedToChangeSettings}>
              <input type="submit" value="Set pack/minigame" disabled={$roomRequestedToChangeSettings}>
            </form>
          {/if}

          {#if $room.minigame && !$room.minigame.supportsMobile && $room.players.find(p => p.mobile)}
            <p>WARNING: There is at least one mobile player in this lobby and this minigame doesn't support mobile devices!</p>
          {/if}
        {/if}
      </div>
    </div>
    <div class="action-container">
      <div>
        <button class="action-button invite" onclick={copyInviteLink}>
          Invite
        </button>
      </div>
      <div>
        <button class="action-button start" onclick={startGame} disabled={!$room || $room.room.host !== $room.user || $roomRequestedToStartGame}>
          Start
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .center {
    text-align: center;
  }
  
  .app-container {
    display: grid;
    height: 100%;
    align-items: center;
    vertical-align: middle;
    overflow: auto;
    overflow-wrap: anywhere;
  }
  .content-container {
    margin: 24px 16vh 24px 16vh;
  }
  .nav-container {
    display: flex;
    align-content: center;
    justify-content: center;
  }
  .nav-container > .left {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .nav-container > .center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .nav-container > .right {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .main-container {
    position: relative;
    display: flex;
    flex-direction: row;
    height: 390px;
    margin-top: 12px;
    gap: 12px;
  }
  .card {
    background-color: var(--primary);
    color: var(--primary-text);
    border-radius: 15px;
    padding: 5px;
    overflow: auto;
  }
  .card::-webkit-scrollbar {
    width: 10px;
  }
  .card::-webkit-scrollbar-track {
    background: #fafafa;
  }
  .card::-webkit-scrollbar-thumb {
    background: #6d7781;
  }
  .card::-webkit-scrollbar-thumb:hover {
    background: #4c5660;
  }
  .main-container > .left {
    width: 30%;
  }
  .main-container > .right {
    width: 70%;
  }
  .minigame-container {
    overflow: auto;
    overflow-wrap: anywhere;
  }

  .logo {
    width: 120px;
  }
  
  .view-container {
    display: none;
  }

  .settings-menu {
    position: absolute;
    margin-top: 150px;
    text-align: right;
    z-index: 10;
  }

  .action-container {
    width: 100%;
    margin-top: 20px;
    display: flex;
    align-content: center;
    justify-content: center;
    gap: 12px;
  }
  .action-container div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 50%;
    min-height: 50px;
    height: 55px;
  }
  .action-button {
    position: relative;
    color: white;
    flex: 1;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    min-height: 50px;
    height: 55px;
    font-size: calc(18px);
    font-weight: bold;
    transition: 0.3s;
  }
  .action-button:hover {
    transform: scale(1.03);
  }
  .action-button.invite {
    background-color: var(--secondary-button);
  }
  .action-button.invite:hover {
    background-color: #343a40;
  }
  .action-button.invite:click {
    background-color: #343a40;
  }
  .action-button:active {
    top: 1px;
  }
  .action-button.start {
    background-color: var(--success-button);
  }
  .action-button.start:hover {
    background-color: #19713e;
  }

  @media only screen and (max-width: 950px) {
    .view-container {
      display: block;
    }
    .main-container > .left, .main-container > .right {
      width: 100%;
    }
    .hidden {
      display: none;
    }
    .logo.main {
      display :none;
    }
  }

  @media only screen and (max-width: 1000px) {
    .content-container {
      margin: 24px 4vh 24px 4vh;
    }
  }

  @media only screen and (max-width: 480px) {
    .content-container {
      margin: 2px 2vh 2px 2vh;
    }
    .nav-container {
      display: flex;
      width: 100%;
    }
  }
</style>
