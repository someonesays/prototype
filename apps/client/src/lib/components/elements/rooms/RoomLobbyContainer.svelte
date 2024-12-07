<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { clickOutside } from "$lib/utils/clickOutside";

import Logo from "$lib/components/icons/Logo.svelte";
import GearIcon from "$lib/components/icons/GearIcon.svelte";
import DoorOpen from "$lib/components/icons/DoorOpen.svelte";
import TriangleExclamation from "$lib/components/icons/TriangleExclamation.svelte";
import Crown from "$lib/components/icons/Crown.svelte";
import Copy from "$lib/components/icons/Copy.svelte";
import Flag from "$lib/components/icons/Flag.svelte";

import Modal from "../cards/Modal.svelte";

import { volumeValue } from "$lib/components/stores/settings";
import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import {
  room,
  roomWs,
  roomRequestedToChangeSettings,
  roomRequestedToStartGame,
  roomRequestedToLeave,
  roomLobbyPopupMessage,
} from "$lib/components/stores/roomState";
import { isModalOpen } from "$lib/components/stores/modal";

import { ClientOpcodes, ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { Events, Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let isSettingsOpen = $state(false);
let activeView = $state<"players" | "game">("game");

let discordActivityLayoutModeUpdate = $state<((evt: { layout_mode: 0 | 1 | 2 | -1 }) => void) | null>(null);
let logoOnly = $state(false);

let isHoveringFlag = $state(false);

onMount(() => {
  $roomRequestedToChangeSettings = false;
  $roomRequestedToStartGame = false;

  if ($launcher === "discord" && $launcherDiscordSdk) {
    $launcherDiscordSdk.subscribe(
      Events.ACTIVITY_LAYOUT_MODE_UPDATE,
      (discordActivityLayoutModeUpdate = ({ layout_mode: layoutMode }) => {
        logoOnly = layoutMode === 0 ? false : true;

        if (layoutMode === 0) {
          document.body.classList.add("discord");
        } else {
          document.body.classList.remove("discord");
        }
      }),
    );
  }

  return () => {
    $isModalOpen = false;

    if ($launcher === "discord" && $launcherDiscordSdk && discordActivityLayoutModeUpdate) {
      $launcherDiscordSdk.unsubscribe(Events.ACTIVITY_LAYOUT_MODE_UPDATE, discordActivityLayoutModeUpdate);
    }
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

function removePack() {
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: {
      packId: null,
      minigameId: $room?.minigame?.id,
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

function copyInviteLinkNormal() {
  navigator.clipboard.writeText(`${location.origin}/join/${$room?.room.id}`);
}

async function copyInviteLink() {
  try {
    switch ($launcher) {
      case "normal": {
        copyInviteLinkNormal();

        $roomLobbyPopupMessage = { type: "invite" };
        $isModalOpen = true;

        break;
      }
      case "discord": {
        if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");

        if (!$launcherDiscordSdk.guildId) {
          $roomLobbyPopupMessage = { type: "warning", message: "Cannot create instant invite links in a non-guild!" };
          $isModalOpen = true;
          return;
        }

        try {
          const { permissions } = await $launcherDiscordSdk.commands.getChannelPermissions();
          if (PermissionUtils.can(Permissions.CREATE_INSTANT_INVITE, permissions)) {
            await $launcherDiscordSdk.commands.openInviteDialog();
          } else {
            $roomLobbyPopupMessage = { type: "warning", message: "Missing permission! Cannot create instant invite link." };
            $isModalOpen = true;
          }
        } catch (err) {
          $roomLobbyPopupMessage = { type: "warning", message: "You cannot create instant invite links at this time." };
          $isModalOpen = true;
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
    $roomLobbyPopupMessage = {
      type: "warning",
      message: ErrorMessageCodesToText[ErrorMessageCodes.WS_CANNOT_START_WITHOUT_MINIGAME],
    };
    $isModalOpen = true;
    return;
  }

  if ($room.minigame.minimumPlayersToStart > $room.players.length) {
    $roomLobbyPopupMessage = {
      type: "warning",
      message: `There must be at least ${$room.minigame.minimumPlayersToStart} players to start this minigame!`,
    };
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

function openUrl(evt: MouseEvent) {
  evt.preventDefault();

  const url = (evt.target as HTMLLinkElement).href;
  switch ($launcher) {
    case "normal":
      $roomLobbyPopupMessage = { type: "link", url };
      $isModalOpen = true;
      break;
    case "discord":
      $launcherDiscordSdk?.commands.openExternalLink({ url });
      break;
  }
}

function handleReport() {
  if (!$room?.minigame) return;

  const url = `${env.VITE_BASE_FRONTEND}/report?${$room.pack ? `pack_id=${$room.pack.id}&` : ""}minigame_id=${$room.minigame.id}`;
  switch ($launcher) {
    case "normal":
      window.open(url, "_blank");
      break;
    case "discord":
      $launcherDiscordSdk?.commands.openExternalLink({ url });
      break;
  }
}

function previousMinigameInPack() {
  alert("WIP");
}

function nextMinigameInPack() {
  alert("WIP");
}
</script>

{#if logoOnly}
  <div class="logoonly-container">
    <div class="logo">
      <Logo />
    </div>
  </div>
{:else}
  <Modal>
    {#if $roomLobbyPopupMessage?.type === "warning"}
      <div class="modal-icon"><TriangleExclamation /></div>
      <p>{$roomLobbyPopupMessage?.message}</p>
      <p><button class="secondary-button margin-8px" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "link"}
      <div class="modal-icon"><TriangleExclamation /></div>
      <p>Are you sure you want to open an external website?</p>
      <p>
        <a class="url" data-sveltekit-preload-data="off" href={$roomLobbyPopupMessage.url} onclick={evt => evt.preventDefault()}>
          {$roomLobbyPopupMessage.url}
        </a>
      </p>
      <p>
        <a data-sveltekit-preload-data="off" href="{$roomLobbyPopupMessage.url}" target="_blank">
          <button class="error-button margin-8px">Open</button>
        </a>
        <button class="secondary-button margin-8px" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {:else if $roomLobbyPopupMessage?.type === "invite"}
    <div class="modal-icon"><Copy /></div>
      <p>Copied invite link!</p>
      <p><a class="url" href={`${location.origin}/join/${$room?.room.id}`} onclick={evt => {evt.preventDefault(); copyInviteLinkNormal();}}>{location.origin}/join/{$room?.room.id}</a></p>
      <p><button class="secondary-button margin-8px" onclick={() => $isModalOpen = false}>Close</button></p>
    {/if}
  </Modal>

  <div class="app scrollbar">
    <div class="nav-container scrollbar">
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
          <div class="view-container main">
            <button class="view-button" class:active={activeView === 'game'} onclick={() => activeView = "game"}>Minigame</button>
            <button class="view-button" class:active={activeView === 'players'} onclick={() => activeView = "players"}>Players</button>
          </div>
        {/if}
      </div>
      <div class="settings-container" use:clickOutside={() => isSettingsOpen = false}>
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
        <button class="button settings" class:active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen}>
          <div><GearIcon /></div>
        </button>
      </div>
    </div>
    <div class="main-container">
      <div class="players-container scrollbar" class:hidden={activeView !== 'players'}>
        <h2 class="players-header">Players ({$room?.players.length ?? 0})</h2>
        <div class="players-list">
          {#if $room}
            {#each $room.players as player}
              <div class="player-card scrollbar" class:client-is-host={$room.user === $room.room.host && $room.user !== player.id}>
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
                    <div>
                      <button class="error-button margin-8px playeraction-button kick" onclick={() => kickPlayer(player.id)}>Kick</button>
                      <button class="secondary-button margin-8px playeraction-button transfer-host" onclick={() => transferHost(player.id)}>Transfer Host</button>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
          <br />
        </div>
      </div>
      <div class="game-container scrollbar" class:hidden={activeView !== 'game'}>
        <div class="game-section scrollbar">
          {#if $room}
            <!-- testing code -->
            {#if $room.room.host === $room.user && !$room.minigame}
              <form onsubmit={setSettings}>
                <input type="text" name="pack_id" placeholder="Pack ID" disabled={$roomRequestedToChangeSettings}>
                <input type="text" name="minigame_id" placeholder="Minigame ID" disabled={$roomRequestedToChangeSettings}>
                <input type="submit" value="Set pack/minigame" disabled={$roomRequestedToChangeSettings}>
              </form>
            {/if}
            <!-- end of testing code -->

            {#if $room.minigame}
              <div class="options-container">
                <div class="pack-container scrollbar" class:no-pack={!$room.pack}>
                  {#if $room.pack}
                    <div class="pack-image">
                      {#if $room.pack?.iconImage}
                        <img class="pack-image" alt="Pack icon" src={
                          $launcher === "normal"
                            ? $room.pack.iconImage.normal
                            : $room.pack.iconImage.discord
                        } />
                      {/if}
                    </div>
                    <div>
                      <div class="pack-name">{$room.pack.name}</div>
                      <div class="pack-author">by {$room.pack.author.name}</div>
                    </div>
                  {:else}
                    <div>
                      <div class="pack-name">No pack selected!</div>
                    </div>
                  {/if}
                </div>
                <div class="select-container scrollbar">
                  <button class="secondary-button select-button">Select minigame</button>
                  <button class="primary-button select-button">Change pack</button>
                  <button class="error-button select-button" onclick={removePack}>Remove pack</button>
                  <button class="report-button" onclick={handleReport} onmouseenter={() => isHoveringFlag = true} onmouseleave={() => isHoveringFlag = false}>
                    <Flag color={isHoveringFlag ? "#d00000" : "#ff0000"} />
                  </button>
                </div>
              </div>
      
              {#if $room.minigame && !$room.minigame.supportsMobile && $room.players.find(p => p.mobile)}
                <p>WARNING: There is at least one mobile player in this lobby and this minigame doesn't support mobile devices!</p>
              {/if}

              <hr class="border" />

              <div class="nextup-container">
                <div>
                  <h3 class="nextup-text">NEXT UP</h3>
                  <h1 class="nextup-minigame-name">{$room.minigame.name}</h1>
                  <p class="nextup-minigame-author">by {$room.minigame.author.name}</p>
                  <p class="nextup-minigame-description">{$room.minigame.description}</p>

                  <div class="nextup-minigame-legal-container desktop">
                    {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                      <p class="nextup-minigame-legal">The developer of <b>{$room.minigame.name}</b>'s
                        {#if $room.minigame.privacyPolicy && $room.minigame.termsOfServices}
                        <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl}>
                          privacy policy
                        </a>
                        and
                        <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl}>
                          terms of service
                        </a>
                        {:else if $room.minigame.privacyPolicy}
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl}>
                            privacy policy
                          </a>
                        {:else if $room.minigame.termsOfServices}
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl}>
                            terms of service
                          </a>
                        {/if}
                        apply to this minigame.
                      </p>
                    {/if}
                  </div>
                </div>
                <div class="nextup-minigame-preview">
                  {#if $room.minigame?.previewImage}
                    <img class="nextup-minigame-preview-image" alt="Minigame preview" src={$launcher === "normal" ? $room.minigame.previewImage.normal : $room.minigame.previewImage.discord} />
                  {/if}
                </div>
                <div class="nextup-minigame-legal-container mobile">
                  {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                    <p class="nextup-minigame-legal">The developer of <b>{$room.minigame.name}</b>'s
                      {#if $room.minigame.privacyPolicy && $room.minigame.termsOfServices}
                      <a class="url" href={$room.minigame.privacyPolicy} onclick={openUrl}>privacy policy</a> and <a class="url" href={$room.minigame.termsOfServices} onclick={openUrl}>terms of service</a>
                      {:else if $room.minigame.privacyPolicy}
                        <a class="url" href={$room.minigame.privacyPolicy} onclick={openUrl}>privacy policy</a>
                      {:else if $room.minigame.termsOfServices}
                        <a class="url" href={$room.minigame.termsOfServices} onclick={openUrl}>terms of service</a>
                      {/if}
                      apply to this minigame.
                    </p>
                  {/if}
                </div>
              </div>

              <div class="previousnext-container">
                <div class="previousnext-section">
                  <button class="previousnext-button" onclick={previousMinigameInPack}>Previous</button>
                  <button class="previousnext-button" onclick={nextMinigameInPack}>Next</button>
                </div>
              </div>
            {:else}
              <p>die</p>
            {/if}
          {/if}
        </div>
        <div class="action-container desktop scrollbar">
          <button class="action-button invite" onclick={copyInviteLink} disabled={!$room}>Invite</button>
          <button class="action-button start" onclick={startGame} disabled={!$room || $room.room.host !== $room.user || $roomRequestedToStartGame}>Start</button>
        </div>
      </div>
    </div>
    <div class="action-container mobile scrollbar">
      <button class="action-button invite" onclick={copyInviteLink} disabled={!$room}>Invite</button>
      <button class="action-button start" onclick={startGame} disabled={!$room || $room.room.host !== $room.user || $roomRequestedToStartGame}>Start</button>
    </div>
  </div>
{/if}

<style>
  .logoonly-container {
    margin-left: calc(var(--sail) * -1);
    margin-right: calc(-50% - var(--sair));
    margin-top: calc(var(--sait) * -1);
    margin-bottom: calc(var(--saib) * -1);

    position: absolute;
    top: 50%;
    left: 49%;
    transform: translate(-50%, -50%)
  }

  .app {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    min-height: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
    overflow: auto;
  }

  .nav-container {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    margin-bottom: .75rem;
  }
  
  .nav-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  .view-container {
    display: flex;
    gap: 2vw;
  }
  .view-container.main {
    justify-content: center;
    align-items: center;
  }
  .logo {
    width: 90px;
  }
  .logo.main {
    display: none;
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
  @media (hover: hover) and (pointer: fine) {
    .view-button:hover {
      background-color: #4712b1;
    }
  }

  .settings-container {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .settings-menu {
    position: fixed;
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
    min-height: 200px;
    max-height: 550px;
  }
  .hidden {
    display: none;
  }

  .players-container, .game-container {
    color: var(--primary-text);
    flex: 1 1 auto;
    height: calc(100% - 150px);
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
    height: calc(100% - 96px);
    overflow-y: auto;
  }

  .players-header {
    margin: 12px;
    text-align: center;
  }
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    max-height: calc(100% - 250px);
  }
  .player-card {
    background: var(--secondary);
    border: 1px #b3b3b3 solid;
    display: flex;
    min-height: 40.6px;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow: auto;
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

  .player-card.client-is-host:hover .player-avatar,
  .player-card.client-is-host:hover .player-name,
  .player-card.client-is-host:hover .player-points {
    display: none;
  }
  .player-actions {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .player-card.client-is-host:hover .player-actions {
    display: flex;
    flex: 1;
    animation-name: player-actions-pointer-actions;
    animation-duration: 0.3s;
  }
  @keyframes player-actions-pointer-actions {
    0% { 
      pointer-events: none;
    }
    100% {
      pointer-events: all;
    }
  }

  .options-container {
    display: flex;
    gap: 12px;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    white-space: pre-line;
  }
  .pack-container {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    overflow: auto;
  }
  .pack-container.no-pack {
    margin-top: 12px;
    margin-bottom: 6px;
  }
  .pack-name {
    font-weight: bold;
  }
  .pack-author {
    font-size: 14px;
  }
  .select-container {
    display: flex;
    gap: 5px;
    overflow: auto;
  }
  
  .border {
    width: 99%;
    margin-top: 1rem;
    border-top: 1px solid #b3b3b3;
  }

  .pack-image {
    min-width: 4rem;
    min-height: 4rem;
    width: 4rem;
    height: 4rem;
    
    margin-right: 6px;
    border-radius: 0.5rem;
    background: var(--card-stroke);
  }

  .pack-image img {
    display: flex;
  }

  .select-button {
    width: 105px;
  }
  .select-button.secondary-button {
    width: 120px;
  }

  .report-button {
    background: none;
    height: 40px;
    cursor: pointer;
    border: none;
    margin-left: 6px;
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
    margin: 4px 0;
    font-size: 14px;
  }
  .nextup-minigame-description {
    margin: 12px 0;
  }
  .nextup-minigame-legal-container.mobile {
    display: block;
  }
  .nextup-minigame-legal-container.desktop {
    display: none;
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
    width: 100%;
    height: auto;
    overflow: auto;
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
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap;
    flex: 1;
    transition: 0.3s;
  }
  .previousnext-button {
    padding: 0.45rem 1.5rem;
    font-size: 14px;
  }
  .action-button {
    padding: 0.75rem 1.5rem;
    height: 50px;
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
    background-color: #19713e;
  }

  .playeraction-button {
    margin-top: 0px;
    padding: 5px;
    height: 40px;
  }
  .playeraction-button {
    width: 70px;
  }
  .playeraction-button.transfer-host {
    width: 120px;
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
  
  @media (max-height: 319px) {
    .app {
      padding: 0;
      transform: scale(0.9);
    }
    .nav-container {
      overflow: auto;
      min-height: 65px;
      margin-bottom: 0;
    }
    .action-container, .previousnext-container {
      gap: 4vw;
      overflow: auto;
    }
    .view-container {
      gap: 1vw;
    }
    .view-container.main {
      margin: 0 12px;
    }
  }
  @media (max-height: 150px) {
    .app {
      transform: scale(0.8);
    }
  }
  @media (width < 900px) {
    .nav-container {
      overflow: auto;
    }
    .nextup-container {
      flex-flow: column wrap;
    }
    .nextup-minigame-preview {
      margin-left: 0px;
      width: 100%;
    }
  }
  @media (min-width: 900px) {
    .view-container {
      display: none;
    }
    .logo.main {
      display: block;
    }

    .main-container {
      flex-direction: row;
    }
    .hidden {
      display: block;
    }
    
    .nextup-minigame-legal-container.mobile {
      display: none;
    }
    .nextup-minigame-legal-container.desktop {
      display: block;
    }

    .players-container {
      flex: 1;
      height: auto;
      max-width: 300px;
    }
    .game-container {
      flex: 2;
      height: auto;
    }
    .action-container.desktop {
      display: flex;
    }
    .action-container.mobile {
      display: none;
    }
  }
  @media (min-width: 900px) and (max-width: 1200px) {
    .players-container {
      min-width: 250px;
    }
  }

  /* lazy fixes for very small screens */
  @media (max-height: 241px) {
    .nav-container {
      margin-top: 30px;
    }
  }
  @media (max-height: 215px) {
    .nav-container {
      margin-top: 49px;
    }
  }
  @media (max-height: 190px) {
    .nav-container {
      margin-top: 90px;
    }
  }
  @media (max-height: 150px) {
    .nav-container {
      margin-top: 140px;
    }
  }
  @media (max-height: 100px) {
    .nav-container {
      margin-top: 180px;
    }
  }
  @media (max-height: 60px) {
    .nav-container {
      margin-top: 200px;
    }
  }
</style>
