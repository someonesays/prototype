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
import Discord from "$lib/components/icons/Discord.svelte";

import Modal from "$lib/components/elements/cards/Modal.svelte";

import RoomLobbyFeaturedMinigames from "$lib/components/elements/rooms/lists/RoomLobbyFeaturedMinigames.svelte";

import { volumeValue } from "$lib/stores/home/settings";
import { launcher, launcherDiscordSdk } from "$lib/stores/home/launcher";
import {
  room,
  roomWs,
  roomRequestedToChangeSettings,
  roomRequestedToStartGame,
  roomRequestedToLeave,
  roomLobbyPopupMessage,
} from "$lib/stores/home/roomState";
import { isModalOpen } from "$lib/stores/home/modal";

import {
  ClientOpcodes,
  ErrorMessageCodes,
  ErrorMessageCodesToText,
  GameSelectPreviousOrNextMinigame,
  MinigamePublishType,
  PackPublishType,
  type ApiGetPackMinigames,
} from "@/public";
import { Common, Events, Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let isSettingsOpen = $state(false);
let activeView = $state<"players" | "game">("game");

let removeIdsOption = $derived($launcher === "discord"); // temp - if I go for Discord App Pitches (dw about not enforcing it backend)

let discordActivityLayoutModeUpdate = $state<((evt: { layout_mode: 0 | 1 | 2 | -1 }) => void) | null>(null);
let logoOnly = $state(false);

let isHoveringFlag = $state(false);
let disableTabIndex = $derived($isModalOpen ? -1 : 0);

let transformScale = $state(1);

let minigamesInPack = $state<
  | { loading: false; loaded: false }
  | { loading: true; loaded: boolean; packId: string; packMinigames?: ApiGetPackMinigames; controller?: AbortController }
>({
  loading: false,
  loaded: false,
});

onMount(() => {
  $roomRequestedToChangeSettings = false;
  $roomRequestedToStartGame = false;

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

  // Handles DiscordSdk for the Discord activity

  if ($launcher === "discord" && $launcherDiscordSdk) {
    // Unlocks orientation lock state
    $launcherDiscordSdk.commands.setOrientationLockState({
      lock_state: Common.OrientationLockStateTypeObject.UNLOCKED,
      picture_in_picture_lock_state: Common.OrientationLockStateTypeObject.UNLOCKED,
      grid_lock_state: Common.OrientationLockStateTypeObject.UNLOCKED,
    });

    // Handles layout mode changes
    $launcherDiscordSdk.subscribe(
      Events.ACTIVITY_LAYOUT_MODE_UPDATE,
      (discordActivityLayoutModeUpdate = ({ layout_mode: layoutMode }) => {
        logoOnly = !!layoutMode;

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

    window.removeEventListener("resize", resize);

    if ($launcher === "discord" && $launcherDiscordSdk && discordActivityLayoutModeUpdate) {
      $launcherDiscordSdk.unsubscribe(Events.ACTIVITY_LAYOUT_MODE_UPDATE, discordActivityLayoutModeUpdate);
    }
  };
});

function setSettingsForm(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  $roomRequestedToChangeSettings = true;

  const form = new FormData(evt.target as HTMLFormElement);
  const packId = (form.get("pack_id") as string) || null;
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { packId, minigameId },
  });
}

function setSettings({ packId = null, minigameId = null }: { packId?: string | null; minigameId?: string | null }) {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { packId, minigameId },
  });
}

export async function handleSelectMinigame() {
  $roomLobbyPopupMessage = { type: "select-minigame" };
  $isModalOpen = true;
}

export async function handleSelectMinigameInPack(noModal = false) {
  if (!$room?.pack) {
    throw new Error("Missing pack on handleSelectMinigameInPack");
  }

  const packId = $room.pack.id;

  // If cached or loading, use that information

  if (minigamesInPack.loading && minigamesInPack.packId === packId) {
    if (noModal) return;

    $roomLobbyPopupMessage = { type: "select-minigame-in-pack" };
    $isModalOpen = true;
    return;
  }

  // Get minigames in pack

  if (minigamesInPack.loading && minigamesInPack.controller) minigamesInPack.controller.abort();

  const controller = new AbortController();
  minigamesInPack = { loading: true, loaded: false, packId, controller };

  let url: string;
  switch ($launcher) {
    case "normal":
      url = `${env.VITE_BASE_API}/api/packs/${$room.pack.id}/minigames`;
      break;
    case "discord":
      url = `/.proxy/api/packs/${$room.pack.id}/minigames`;
      break;
    default:
      throw new Error("Invalid launcher for handleSelectMinigameInPack");
  }

  if (!noModal) {
    $roomLobbyPopupMessage = { type: "select-minigame-in-pack" };
    $isModalOpen = true;
  }

  try {
    const res = await fetch(url, { method: "get", signal: controller.signal });
    const packMinigames = (await res.json()) as ApiGetPackMinigames;

    if (!res.ok) throw new Error("Failed to load minigames in pack (response is not OK)");

    minigamesInPack = { loading: true, loaded: true, packId, packMinigames, controller: undefined };
  } catch (err) {
    console.error(err);
    minigamesInPack = { loading: false, loaded: false };

    if (!noModal) {
      $roomLobbyPopupMessage = { type: "warning", message: "Failed to load minigames in pack." };
      $isModalOpen = true;
    }
  }
}

function handleSelectPack() {
  $roomLobbyPopupMessage = { type: "select-pack" };
  $isModalOpen = true;
}

function handleSelectPackFeatured() {
  $roomLobbyPopupMessage = { type: "select-pack-featured" };
  $isModalOpen = true;
}

function handleRemoveMinigameAndPack() {
  if (!$room?.minigame?.id) throw new Error("Cannot remove pack without minigame");

  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { packId: null, minigameId: null },
  });
}

function handleReport() {
  if (!$room?.minigame) return;

  $roomLobbyPopupMessage = { type: "report" };
  $isModalOpen = true;
}

function previousMinigameInPack() {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SELECT_PREVIOUS_OR_NEXT_MINIGAME,
    data: { direction: GameSelectPreviousOrNextMinigame.Previous },
  });
}

function nextMinigameInPack() {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SELECT_PREVIOUS_OR_NEXT_MINIGAME,
    data: { direction: GameSelectPreviousOrNextMinigame.Next },
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

function startGame(ignoreWarning: boolean) {
  if (!$room || $room.user !== $room.room.host) {
    $roomLobbyPopupMessage = {
      type: "warning",
      message: "Only the host can start the game!",
    };
    $isModalOpen = true;
    return;
  }

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

  if (!ignoreWarning && !$room.minigame.supportsMobile && $room.players.find((p) => p.mobile)) {
    $roomLobbyPopupMessage = { type: "mobile" };
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

function joinDiscordServer(evt: MouseEvent) {
  if ($launcher === "discord") {
    evt.preventDefault();
    $launcherDiscordSdk?.commands.openExternalLink({ url: "https://discord.gg/zVWekYCEC9" });
    return;
  }
}
</script>

{#if logoOnly}
  <div class="logoonly-container">
    <div class="logo">
      <Logo />
    </div>
  </div>
{:else}
  <Modal style="transform: scale({transformScale});">
    {#if $roomLobbyPopupMessage?.type === "warning"}
      <br><br>
      <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
      <p>{$roomLobbyPopupMessage?.message}</p>
      <p><button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "link"}
      <br><br>
      <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
      <p>Are you sure you want to open an external website?</p>
      <p>
        <a class="url disabled-no-pointer" data-sveltekit-preload-data="off" href={$roomLobbyPopupMessage.url} onclick={evt => evt.preventDefault()} tabindex=-1>
          {$roomLobbyPopupMessage.url}
        </a>
      </p>
      <p>
        <a data-sveltekit-preload-data="off" href="{$roomLobbyPopupMessage.url}" target="_blank">
          <button class="error-button margin-top-8px">Open</button>
        </a>
        <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {:else if $roomLobbyPopupMessage?.type === "invite"}
      <br><br>
      <div class="modal-icon"><Copy color="#000000" /></div>
      <p>Copied invite link!</p>
      <p><a class="url disabled-no-pointer" data-sveltekit-preload-data="off" href={`${location.origin}/join/${$room?.room.id}`} onclick={evt => evt.preventDefault()} tabindex=-1>{location.origin}/join/{$room?.room.id}</a></p>
      <p><button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "select-minigame"}
      <h2 style="width: 400px; max-width: 100%;">Select a minigame by ID</h2>

      <form onsubmit={setSettingsForm}>
        <input class="input" type="text" name="minigame_id" placeholder="Minigame ID" value={$room?.minigame?.id ?? ""} disabled={$roomRequestedToChangeSettings} maxlength="50">

        <br><br>
        <input class="primary-button wait-on-disabled" type="submit" value="Set minigame" disabled={$roomRequestedToChangeSettings}>
        <button class="secondary-button margin-top-8px" onclick={(evt) => { evt.preventDefault(); $isModalOpen = false }}>Close</button>
      </form>
    {:else if $roomLobbyPopupMessage?.type === "select-minigame-in-pack"}
      <h2 style="width: 400px; max-width: 100%;">Select minigame in the pack!</h2>
      {#if minigamesInPack.loaded && minigamesInPack.packMinigames}
        {#if minigamesInPack.packMinigames.minigames.length === 0}
          <p>This pack is empty!</p>
        {:else}
          <div class="select-minigame-container" style="width: 400px; max-width: 100%;">
            {#each minigamesInPack.packMinigames.minigames as minigame}
              <div>
                <button class="select-minigame-button" disabled={$roomRequestedToChangeSettings} onclick={() => setSettings({ packId: $room?.pack?.id, minigameId: minigame.id })}>
                  
                  <div class="preview-image">
                    {#if minigame?.previewImage}
                      <img class="preview-image image-fade-in" alt="Pack icon" src={
                        $launcher === "normal"
                          ? minigame.previewImage.normal
                          : minigame.previewImage.discord
                      } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
                    {/if}
                  </div>
                  <div class="featured-pack-text">
                    {minigame.name}
                  </div>

                </button>
              </div>

            {/each}
          </div>
          <br>
        {/if}
      {:else}
        <p>Loading minigames in pack...</p>
      {/if}

      {#if !removeIdsOption}
        <button class="primary-button" onclick={(evt) => { evt.preventDefault(); handleSelectMinigame(); }} tabindex={disableTabIndex}>
          Select minigame by ID
        </button>
      {/if}
      <button class="secondary-button margin-top-8px" onclick={(evt) => { evt.preventDefault(); $isModalOpen = false; }}>Close</button>
    {:else if $roomLobbyPopupMessage?.type === "select-pack"}
      <h2 style="width: 400px; max-width: 100%;">Select a pack by ID</h2>
      
      <form onsubmit={setSettingsForm}>
        <input class="input" type="text" name="pack_id" placeholder="Pack ID" value={$room?.pack?.id ?? ""} disabled={$roomRequestedToChangeSettings} maxlength="50">

        <br><br>
        <input class="primary-button wait-on-disabled" type="submit" value="Set pack" disabled={$roomRequestedToChangeSettings}>
        <button class="secondary-button margin-top-8px" onclick={(evt) => { evt.preventDefault(); $isModalOpen = false }}>Close</button>
      </form>
    {:else if $roomLobbyPopupMessage?.type === "select-pack-featured"}
      <h2 style="width: 400px; max-width: 100%;">Select a featured pack!</h2>

      <RoomLobbyFeaturedMinigames />

      {#if !removeIdsOption}
        <button class="primary-button margin-top-16px" onclick={() => handleSelectPack()}>Set pack by ID</button>
        <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
      {:else}
        <button class="secondary-button margin-top-16px" onclick={() => $isModalOpen = false}>Cancel</button>
      {/if}
      
    {:else if $roomLobbyPopupMessage?.type === "report"}
      <h2>Report</h2>
      <p>You can report packs and minigames on our Discord server!</p>
      <p>
        <a href="https://discord.gg/zVWekYCEC9" onclick={joinDiscordServer} target="_blank">
          <button class="primary-button margin-top-8px">Join Discord server</button>
        </a>
        <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {:else if $roomLobbyPopupMessage?.type === "mobile"}
      <br><br>
      <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
      <p>
        This minigame doesn't support mobile devices!<br>
        Do you wish to continue?
      </p>
      <p>
        <button class="primary-button margin-top-8px wait-on-disabled" onclick={() => startGame(true)}>Start</button>
        <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {/if}
  </Modal>

  <div class="app">
    <div class="app-section" style="transform: scale({transformScale}); height: {transformScale === 1 ? "100%" : `${window.innerHeight / transformScale}px`};">
      <div class="nav-container">
        <div class="leave">
          {#if $launcher === "normal"}
            <button class="button leave" onclick={leaveGame} tabindex={disableTabIndex}>
              <div><DoorOpen /></div>
            </button>
          {:else}
            <div class="logo main">
              <Logo />
            </div>
            <div class="view-container">
              <button class="view-button" class:active={activeView === 'game'} onclick={() => activeView = "game"} tabindex={disableTabIndex}>Minigame</button>
              <button class="view-button" class:active={activeView === 'players'} onclick={() => activeView = "players"} tabindex={disableTabIndex}>Players</button>
            </div>
          {/if}
        </div>
        <div class="nav-buttons">
          {#if $launcher === "normal"}
            <div class="logo main">
              <Logo />
            </div>
            <div class="view-container main">
              <button class="view-button" class:active={activeView === 'game'} onclick={() => activeView = "game"} tabindex={disableTabIndex}>Minigame</button>
              <button class="view-button" class:active={activeView === 'players'} onclick={() => activeView = "players"} tabindex={disableTabIndex}>Players</button>
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
              <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} tabindex={disableTabIndex} />
            </div>
          </div>

          {#if $launcher === "discord"}
            <a href="https://discord.gg/zVWekYCEC9" onclick={joinDiscordServer} target="_blank">
              <button class="button discord">
                <div><Discord /></div>
              </button>
            </a>
          {/if}

          <button class="button settings" class:active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen} tabindex={disableTabIndex}>
            <div><GearIcon /></div>
          </button>
        </div>
      </div>
      <div class="main-container">
        <div class="players-container" class:hidden={activeView !== 'players'}>
          <div class="players-section">
            <h2 class="players-header load-fade-in" class:loaded={$room}>Players ({$room?.players.length ?? 0})</h2>
            <div class="players-list load-fade-in" class:loaded={$room}>
              {#if $room}
                {#each $room.players as player}
                  <div class="player-card" class:client-is-host={$room.user === $room.room.host && $room.user !== player.id}>
                    <img class="player-avatar image-fade-in" src={player.avatar} alt="{player.displayName}'s avatar" onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
                    <span class="player-name">
                      {player.displayName}
                    </span>
    
                    {#if $room.room.host === player.id}
                      <Crown color="#ffa64d" />
                    {/if}
                    
                    <span class="player-points">{player.points}</span>
                    
                    {#if $room.room.host === $room.user && $room.user !== player.id}
                      <div class="player-actions">
                        <div>
                          <button class="error-button margin-top-8px playeraction-button kick" onclick={() => kickPlayer(player.id)} tabindex={disableTabIndex}>Kick</button>
                          <button class="secondary-button margin-top-8px playeraction-button transfer-host" onclick={() => transferHost(player.id)} tabindex={disableTabIndex}>Transfer Host</button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}
              <br>
            </div>
          </div>
        </div>
        <div class="game-container" class:hidden={activeView !== 'game'}>
          <div class="game-section">
            {#if $room}
              {#if $room.minigame}
                <div class="options-container load-fade-in" class:loaded={$room}>
                  <div class="pack-container" class:no-pack={!$room.pack}>
                    {#if $room.pack}
                      <div class="preview-image">
                        {#if $room.pack?.iconImage}
                          <img class="preview-image image-fade-in" alt="Pack icon" src={
                            $launcher === "normal"
                              ? $room.pack.iconImage.normal
                              : $room.pack.iconImage.discord
                          } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
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
                  <div class="select-container">
                    {#if $room.room.host === $room.user}
                      {#if $room.pack}
                        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                        <button class="secondary-button select-button" onclick={() => handleSelectMinigameInPack()} tabindex={disableTabIndex}>
                          Select minigame
                        </button>
                        <button class="primary-button select-button" onclick={handleSelectPackFeatured} tabindex={disableTabIndex}>
                          Change pack
                        </button>
                      {:else}
                      <button class="secondary-button select-button" onclick={() => handleSelectMinigame()} tabindex={disableTabIndex}>
                        Select minigame
                      </button>
                        <button class="primary-button select-button" onclick={handleSelectPackFeatured} tabindex={disableTabIndex}>
                          Select pack
                        </button>
                      {/if}
  
                      <button class="error-button select-button wait-on-disabled" onclick={handleRemoveMinigameAndPack} disabled={$roomRequestedToChangeSettings} tabindex={disableTabIndex}>
                        Remove
                      </button>
                    {/if}
  
                    {#if $room.pack?.publishType !== PackPublishType.PUBLIC_OFFICIAL || $room.minigame.publishType !== MinigamePublishType.PUBLIC_OFFICIAL}
                      <button class="report-button" onclick={handleReport} onmouseenter={() => isHoveringFlag = true} onmouseleave={() => isHoveringFlag = false} tabindex={disableTabIndex}>
                        <Flag color={isHoveringFlag ? "#d00000" : "#ff0000"} width="18px" />
                      </button>
                    {/if}
                  </div>
                </div>
  
                <hr class="border load-fade-in" class:loaded={$room} />
  
                <div class="nextup-container load-fade-in" class:loaded={$room}>
                  <div class="nextup-text-container">
                    <h3 class="nextup-text">NEXT UP</h3>
                    <h1 class="nextup-minigame-name">{$room.minigame.name}</h1>
                    <p class="nextup-minigame-author">by {$room.minigame.author.name}</p>
                    <p class="nextup-minigame-description">{$room.minigame.description}</p>
  
                    <div class="nextup-minigame-legal-container desktop">
                      {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                        <p class="nextup-minigame-legal">The developer of <b>{$room.minigame.name}</b>'s
                          {#if $room.minigame.privacyPolicy && $room.minigame.termsOfServices}
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl} tabindex={disableTabIndex}>
                            privacy policy
                          </a>
                          and
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl} tabindex={disableTabIndex}>
                            terms of service
                          </a>
                          {:else if $room.minigame.privacyPolicy}
                            <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl} tabindex={disableTabIndex}>
                              privacy policy
                            </a>
                          {:else if $room.minigame.termsOfServices}
                            <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl} tabindex={disableTabIndex}>
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
                      <img class="nextup-minigame-preview-image image-fade-in" alt="Minigame preview" src={$launcher === "normal" ? $room.minigame.previewImage.normal : $room.minigame.previewImage.discord} onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
                    {/if}
                  </div>
                  <div class="nextup-minigame-legal-container mobile">
                    {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                      <p class="nextup-minigame-legal">The developer of <b>{$room.minigame.name}</b>'s
                        {#if $room.minigame.privacyPolicy && $room.minigame.termsOfServices}
                        <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl} tabindex={disableTabIndex}>
                          privacy policy
                        </a>
                        and
                        <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl} tabindex={disableTabIndex}>
                          terms of service
                        </a>
                        {:else if $room.minigame.privacyPolicy}
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.privacyPolicy} onclick={openUrl} tabindex={disableTabIndex}>
                            privacy policy
                          </a>
                        {:else if $room.minigame.termsOfServices}
                          <a class="url" data-sveltekit-preload-data="off" href={$room.minigame.termsOfServices} onclick={openUrl} tabindex={disableTabIndex}>
                            terms of service
                          </a>
                        {/if}
                        apply to this minigame.
                      </p>
                    {/if}
                  </div>
                </div>
  
                {#if $room.room.host === $room.user && $room.pack}
                  <div class="previousnext-container load-fade-in" class:loaded={$room}>
                    <div class="previousnext-section">
                      <button class="previousnext-button" onclick={previousMinigameInPack} tabindex={disableTabIndex} disabled={$roomRequestedToChangeSettings}>Previous</button>
                      <button class="previousnext-button" onclick={nextMinigameInPack} tabindex={disableTabIndex} disabled={$roomRequestedToChangeSettings}>Next</button>
                    </div>
                  </div>
                {/if}
              {:else}
                <div class="nothingselected-container load-fade-in" class:loaded={$room}>
                  {#if $room && $room.user === $room.room.host}
                    <h2>Choose a minigame pack to play!</h2>

                    <RoomLobbyFeaturedMinigames tabindex={disableTabIndex} />
                    <br>

                    {#if !removeIdsOption}
                      <div class="nothingselected-buttons">
                        <button class="secondary-button nothingselected-button" onclick={handleSelectMinigame} tabindex={disableTabIndex} disabled={$room.user !== $room.room.host || $roomRequestedToChangeSettings}>
                          Select minigame
                        </button>
                        <button class="primary-button nothingselected-button" onclick={handleSelectPack} tabindex={disableTabIndex} disabled={$room.user !== $room.room.host || $roomRequestedToChangeSettings}>
                          Select another pack
                        </button>
                      </div>
                    {/if}
                  {:else}
                    <h2>Waiting for the host to select a minigame!</h2>
                  {/if}
                </div>
              {/if}
            {/if}
          </div>
          <div class="action-container desktop">
            <button class="action-button invite" onclick={copyInviteLink} disabled={!$room} tabindex={disableTabIndex}>Invite</button>
            <button class="action-button start wait-on-disabled" onclick={() => startGame(false)} disabled={!$room || $roomRequestedToStartGame} tabindex={disableTabIndex}>Start{$roomRequestedToStartGame ? "ing..." : ""}</button>
          </div>
        </div>
      </div>
      <div class="action-container mobile">
        <button class="action-button invite" onclick={copyInviteLink} disabled={!$room} tabindex={disableTabIndex}>Invite</button>
        <button class="action-button start wait-on-disabled" onclick={() => startGame(false)} disabled={!$room || $roomRequestedToStartGame} tabindex={disableTabIndex}>Start{$roomRequestedToStartGame ? "ing..." : ""}</button>
      </div>
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
    max-height: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
  }
  .app-section {
    display: flex;
    flex-direction: column;
    justify-content: safe center;
  }

  .load-fade-in {
    opacity: 0;
  }

  .load-fade-in.loaded {
    opacity: 1;
    
    animation-name: fade-in-animation;
    animation-duration: 0.2s;
    animation-timing-function: ease-out;
  }

  @keyframes fade-in-animation {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes appear-animation {
    0% {
      transform: scale(0.99);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes mobile-animation {
    0% {
      margin-top: 4px;
    }
    100% {
      margin-top: 0px;
    }
  }

  .nav-container {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    margin-bottom: .75rem;
    
    padding-top: 5px;

    animation-name: appear-animation;
    animation-duration: 0.6s;
    animation-timing-function: ease-out;
  }
  
  .nav-buttons {
    display: flex;
    justify-content: safe center;
    gap: 0.5rem;
  }
  .view-container {
    display: flex;
    gap: 2vw;
  }
  .view-container.main {
    justify-content: safe center;
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
    right: 0;
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
    
    animation-name: appear-animation;
    animation-duration: 0.6s;
    animation-timing-function: ease-out;
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
  .players-section, .game-section {
    background: var(--primary);
    border-radius: 1rem;
    padding: 1rem;
  }
  .players-section, .game-section {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .players-section, .game-section {
    height: calc(100% - 32px);
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

    transition: transform 0.3s;
    
    animation-name: fade-in-animation;
    animation-duration: 0.2s;
    animation-timing-function: ease-out;
  }
  .player-card:hover {
    transform: scale(1.01)
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
    justify-content: safe center;
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

  .nothingselected-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: safe center;
    overflow: auto;
    min-width: 100px;
    text-align: center;
  }
  .nothingselected-buttons {
    display: flex;
    align-self: center;
    justify-content: safe center;
    white-space: nowrap;
    gap: 4px;
  }
  .nothingselected-button {
    padding: 15px;
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

  .select-button.primary-button {
    width: 100px;
  }
  .select-button.secondary-button {
    width: 120px;
  }
  .select-button.error-button {
    width: 75px;
  }

  .report-button {
    background: none;
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
  .nextup-text-container {
    width: 50%;
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
    border: 1px #b3b3b3 solid;
    background: var(--card-stroke);
    margin-left: 12px;
    width: 50%;

    border-radius: 15px;
    max-width: 300px;
    max-height: 300px;
    aspect-ratio: 1 / 1;
    float: right;
    overflow: auto;
  }
  .nextup-minigame-preview-image {
    border-radius: 15px;
    width: 100%;
    height: auto;
    max-width: 300px;
    max-height: 300px;
    aspect-ratio: 1 / 1;
    float: right;
    overflow: auto;
  }
  
  .action-container {
    gap: 1rem;
    overflow: auto;
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
    display: none;
    margin-top: 0.8rem;
  }
  .action-container.mobile {
    display: flex;
    min-height: 50px;
    margin-top: 1rem;
    padding-bottom: 25px;
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
  .select-minigame-container {
    display: flex;
    max-height: 200px;
    overflow: auto;
    gap: 3px;
    flex-direction: column;
  }
  .previousnext-button {
    padding: 0.45rem 1.5rem;
    font-size: 14px;
  }
  .action-button {
    padding: 0.75rem 1.5rem;
    height: 50px;
    font-size: 18px;
  }
  .previousnext-button {
    width: calc(50% - 2px);
  }
  .action-button:active, .previousnext-button {
    top: 1px;
  }
  .action-button.invite {
    background: var(--primary-button);
    color: var(--primary);
  }
  .previousnext-button {
    background: var(--secondary-button);
    color: var(--primary);
  }
  .action-button.invite:hover {
    background-color: var(--primary-button-hover);
  }
  .action-button.invite:click {
    background-color: var(--primary-button-hover);
  }
  .previousnext-button:hover {
    background-color: #343a40;
  }
  .previousnext-button:click {
    background-color: #343a40;
  }
  .select-minigame-button {
    background: var(--primary);
    display: flex;
    align-items: center;
    border: none;
    border-radius: 15px;
    width: 98%;
    cursor: pointer;
    padding: 6px;
    overflow: auto;
    font-size: 16px;
    gap: 10px;
    transition: 0.2s;
    transform: scale(0.99);
  }
  .select-minigame-button:hover {
    background: #fafafa;
    transform: scale(1);
  }
  .select-minigame-button:disabled {
    cursor: wait;
  }
  .previousnext-button:disabled {
    cursor: wait;
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

  @media (max-height: 319px) {
    .app {
      padding: 0;
      transform: scale(0.9);
    }
    .nav-container {
      min-height: 65px;
      margin-bottom: 0;
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
    .nextup-container {
      flex-flow: column wrap;
    }
    .nextup-text-container {
      width: 100%;
    }
    .nextup-minigame-preview {
      margin-left: 0px;
      width: 100%;
    }
    .nextup-minigame-preview-image {
      float: left;
    }

    .players-container, .game-container {
      animation-name: mobile-animation;
      animation-duration: 0.2s;
      animation-timing-function: ease-out;
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

    .game-section {
      height: calc(100% - 96px);
    }
  }
  @media (min-width: 900px) and (max-width: 1200px) {
    .players-container {
      min-width: 250px;
    }
  }
  @media (max-width: 320px) {
    .nav-container {
      overflow: auto;
    }
  }
  @media (max-width: 380px) {
    .nothingselected-buttons {
      gap: 2px;
    }
  }
</style>
