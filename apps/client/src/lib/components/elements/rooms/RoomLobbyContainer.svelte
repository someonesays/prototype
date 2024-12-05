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
let activeView = $state<"players" | "game">("game");

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

function previousMinigameInPack() {
  alert("WIP");
}

function nextMinigameInPack() {
  alert("WIP");
}
</script>

<Modal>
  <div style="width: 80px; margin: 0 auto;"><TriangleExclamation /></div>
  <p>{$roomLobbyErrorMessage}</p>
  <p><button class="secondary-button" onclick={() => $isModalOpen = false}>Close</button></p>
</Modal>

<div class="app">
  <div class="nav-container">
    <div class="leave">
      {#if $launcher === "normal"}
        <button class="button leave" onclick={leaveGame}>
          <div><DoorOpen /></div>
        </button>
      {:else}
        <div class="logo main">
          <Logo />
        </div>
        <div class="view-container">
          <button class="view-button" class:active={activeView === 'game'} onclick={() => activeView = "game"}>Minigame</button>
          <button class="view-button" class:active={activeView === 'players'} onclick={() => activeView = "players"}>Players</button>
        </div>
      {/if}
    </div>
    <div class="nav-buttons">
      {#if $launcher === "normal"}
        <div class="logo main">
          <Logo />
        </div>
        <div class="view-container">
          <button class="view-button" class:active={activeView === 'game'} onclick={() => activeView = "game"}>Minigame</button>
          <button class="view-button" class:active={activeView === 'players'} onclick={() => activeView = "players"}>Players</button>
        </div>
      {/if}
    </div>
    <div class="settings-container">
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
    <div class="players-container scrollbar" class:hidden={activeView !== 'players'}>
      <h2 class="players-header">Players ({$room?.players.length ?? 0})</h2>
      <div class="players-list">
        {#if $room}
          {#each $room.players as player}
            <div class="player-card">
              <img class="player-avatar" src={player.avatar} alt="{player.displayName}'s avatar" />
              <span class="player-name">
                {player.displayName}
              </span>

              {#if $room.room.host === player.id}
                <Crown />
              {/if}
              
              <span class="player-points">{player.points}</span>
              
              {#if $room.room.host === $room.user && $room.user !== player.id}
                <div class="player-actions">
                  <button onclick={() => kickPlayer(player.id)}>Kick</button>
                  <button onclick={() => transferHost(player.id)}>Transfer Host</button>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
        <br />
      </div>
    </div>
    <div class="game-container" class:hidden={activeView !== 'game'}>
      <div class="game-section scrollbar">
        {#if $room}
          <div class="pack-container">
            <p>Pack: {$room.pack ? JSON.stringify($room.pack) : "None"}</p>
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
          </div>

          <hr class="border" />

          {#if $room.minigame}
            <div class="nextup-container">
              <div>
                <h3 class="nextup-text">NEXT UP</h3>
                <h2 class="nextup-minigame-name">{$room.minigame.name}</h2>
                <p class="nextup-minigame-author">by {$room.minigame.author.name}</p>
                <p class="nextup-minigame-description">{$room.minigame.description}</p>
    
                {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                  <p class="nextup-minigame-legal">The developer of <b>{$room.minigame.name}</b>'s
                    {#if $room.minigame.privacyPolicy && $room.minigame.termsOfServices}
                    <a href={$room.minigame.privacyPolicy} target="_blank">privacy policy</a> and <a href={$room.minigame.termsOfServices} target="_blank">terms of service</a>
                    {:else if $room.minigame.privacyPolicy}
                      <a href={$room.minigame.privacyPolicy} target="_blank">privacy policy</a>
                    {:else if $room.minigame.termsOfServices}
                      <a href={$room.minigame.termsOfServices} target="_blank">terms of service</a>
                    {/if}
                    apply to this minigame.
                  </p>
                {/if}
              </div>
              <div class="nextup-minigame-preview">
                {#if $room.minigame?.previewImage}
                  <img class="nextup-minigame-preview-image" alt="Minigame preview" src={$launcher === "normal" ? $room.minigame.previewImage.normal : $room.minigame.previewImage.discord} />
                {/if}
              </div>
            </div>
          {/if}

          <div class="previousnext-container">
            <div class="previousnext-section">
              <button class="previousnext-button" onclick={previousMinigameInPack}>Previous</button>
              <button class="previousnext-button" onclick={nextMinigameInPack}>Next</button>
            </div>
          </div>
        {/if}
      </div>
      <div class="action-container desktop">
        <button class="action-button invite" onclick={copyInviteLink} disabled={!$room}>Invite</button>
        <button class="action-button start" onclick={startGame} disabled={!$room || $room.room.host !== $room.user || $roomRequestedToStartGame}>Start</button>
      </div>
    </div>
  </div>
  <div class="action-container mobile">
    <button class="action-button invite" onclick={copyInviteLink} disabled={!$room}>Invite</button>
    <button class="action-button start" onclick={startGame} disabled={!$room || $room.room.host !== $room.user || $roomRequestedToStartGame}>Start</button>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
  }

  .nav-container {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    margin-bottom: 1rem;
  }
  .nav-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  .view-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2vw;
  }
  @media (max-width: 319px) {
    .view-container {
      flex-direction: column;
      gap: 2px;
    }
  }
  .logo {
    width: 90px;
  }
  .logo.main {
    display: none;
  }
  @media (min-width: 900px) {
    .view-container {
      display: none;
    }
    .logo.main {
      display: block;
    }
  }

  .view-button {
    background: var(--secondary-button);
    border: none;
    color: var(--primary);
    padding: 0.75rem 5vw;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: 0.1s;
  }
  .view-button.active {
    background: var(--primary-button);
  }
  .view-button:hover {
    background-color: #4712b1;
  }

  .settings-container {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .settings-menu {
    position: absolute;
    margin-top: 150px;
    text-align: right;
    z-index: 10;
  }

  .main-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow: hidden;
  }
  .hidden {
    display: none;
  }
  @media (min-width: 900px) {
    .main-container {
      flex-direction: row;
    }
    .hidden {
      display: block;
    }
    .players-list {
      width: calc(20vw + 1.5rem);
    }
    .player-card {
      width: 20vw;
    }
  }

  .players-container, .game-container {
    color: var(--primary-text);
    flex: 1 1 auto;
    height: calc(100vh - 150px);
    overflow-y: auto;
  }
  .players-container, .game-section {
    background: var(--primary);
    border-radius: 1rem;
    padding: 1rem;
  }
  .game-section {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 207px);
    overflow-y: auto;
  }
  @media (min-width: 900px) {
    .players-container,
    .game-container {
      flex: none;
      height: auto;
    }
    .game-container {
      flex: 2;
    }
    .action-container.desktop {
      display: flex;
    }
    .action-container.mobile {
      display: none;
    }
  }

  .players-header {
    margin: 12px;
    text-align: center;
  }
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    max-height: calc(100vh - 250px);
  }
  .player-card {
    background: var(--secondary);
    border: 1px #b3b3b3 solid;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }
  .player-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }
  .player-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .player-actions {
    opacity: none;
  }

  .pack-container {
    margin-bottom: 1rem;
  }

  .border {
    width: 99%;
    border-top: 1px solid #b3b3b3;
  }

  .nextup-container {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-top: 1rem;
    white-space: pre-line;
  }
  .nextup-text {
    margin: 0;
  }
  .nextup-minigame-name {
    margin: 6px 0 0 0;
  }
  .nextup-minigame-author {
    margin: 0;
  }
  .nextup-minigame-description {
    margin: 6px 0;
  }
  .nextup-minigame-legal {
    font-size: 0.8rem;
  }
  .nextup-minigame-preview {
    margin-left: 12px;
    width: 50%;
  }
  .nextup-minigame-preview-image {
    border: 1px #b3b3b3 solid;
    border-radius: 15px;
    height: auto;
    width: 100%;
    height: 100%;
  }
  
  .action-container {
    gap: 1rem;
  }
  .previousnext-container {
    display: flex;
    margin-top: 12px;
    gap: 1rem;
    flex: 1;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
  }
  .previousnext-section {
    width: 100%;
  }
  .action-container.desktop {
    display: flex;
    margin-top: 0.8rem;
  }
  .action-container.mobile {
    display: none;
    margin-top: 1rem;
  }
  .action-button, .previousnext-button {
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap;
    flex: 1;
    transition: 0.3s;
  }
  .action-button {
    height: 60px;
  }
  .previousnext-button {
    width: calc(50% - 2px);
  }
  .action-button:active, .previousnext-button {
    top: 1px;
  }
  .action-button.invite, .previousnext-button {
    background: var(--secondary-button);
    color: var(--primary);
  }
  .action-button.invite:hover, .previousnext-button:hover {
    background-color: #343a40;
  }
  .action-button.invite:click, .previousnext-button:click {
    background-color: #343a40;
  }
  .action-button.start {
    background: var(--success-button);
    color: var(--primary);
  }
  .action-button.start:hover {
    /* background-color: #4712b1; */
    background-color: #19713e;
  }
  @media (max-width: 319px) {
    .nav-container {
      overflow: auto;
    }
    .action-container, .previousnext-container {
      gap: 4vw;
      overflow: auto;
    }
  }

  .scrollbar::-webkit-scrollbar {
    width: 10px;
  }
  .scrollbar::-webkit-scrollbar-track {
    background: #fafafa;
  }
  .scrollbar::-webkit-scrollbar-thumb {
    background: #6d7781;
  }
  .scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4c5660;
  }
</style>
