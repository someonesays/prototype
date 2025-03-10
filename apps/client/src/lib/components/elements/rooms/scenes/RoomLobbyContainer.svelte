<script lang="ts">
import { onMount } from "svelte";

import SvelteMarkdown from "svelte-markdown";
import MarkdownDisabled from "$lib/components/markdown/MarkdownDisabled.svelte";
import MarkdownLink from "$lib/components/markdown/MarkdownLink.svelte";

import { clickOutside } from "$lib/utils/clickOutside";
import { audio } from "$lib/utils/audio";

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
  roomSearchedMinigames,
} from "$lib/stores/home/roomState";
import { isModalOpen } from "$lib/stores/home/modal";

import { searchMinigames } from "$lib/utils/minigames";

import { ClientOpcodes, ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { Common, Events, Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let isSettingsOpen = $state(false);
let activeView = $state<"players" | "game">("game");

let removeIdsOption = $derived($launcher === "discord"); // temp - if I go for Discord App Pitches (dw about not enforcing it backend)

let discordActivityLayoutModeUpdate = $state<((evt: { layout_mode: 0 | 1 | 2 | -1 }) => void) | null>(null);
let logoOnly = $state(false);

let isHoveringFlag = $state(false);
let disableTabIndex = $derived($isModalOpen ? -1 : 0);

let shortenedMinigameName = $derived(
  $room?.minigame ? ($room.minigame.name.length > 30 ? `${$room.minigame.name.slice(0, 27)}...` : $room.minigame.name) : "",
);

let searchMinigameQuery = $state("");
let searchMinigameTimeout: Timer | null = $state(null);
let searchMinigameAbortController: AbortController | null = $state(null);

let transformScale = $state(1);

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

  const form = new FormData(evt.target as HTMLFormElement);
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { minigameId },
  });
}

function setSettings({ minigameId = null }: { minigameId?: string | null }) {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { minigameId },
  });
}

export async function handleSelectMinigame() {
  $roomLobbyPopupMessage = { type: "select-minigame" };
  $isModalOpen = true;
}

export async function handleCredits() {
  $roomLobbyPopupMessage = { type: "credits" };
  $isModalOpen = true;
}

export async function handleSelectMinigameSearch() {
  if (searchMinigameTimeout) clearTimeout(searchMinigameTimeout);

  $roomSearchedMinigames = null;
  searchMinigameQuery = "";
  searchMinigameTimeout = null;

  $roomLobbyPopupMessage = { type: "select-minigame-search" };
  $isModalOpen = true;

  handleSearchingMinigames();
}

async function handleSearchingMinigames() {
  if (searchMinigameTimeout) clearTimeout(searchMinigameTimeout);
  searchMinigameTimeout = setTimeout(() => ($roomSearchedMinigames = null), 500);

  const oldController = searchMinigameAbortController;
  const controller = (searchMinigameAbortController = new AbortController());
  oldController?.abort();

  const res = await searchMinigames({
    query: searchMinigameQuery,
    include: removeIdsOption ? ["official", "featured"] : ["official", "unofficial", "featured"],
    signal: searchMinigameAbortController.signal,
  });

  if (controller !== searchMinigameAbortController) return;

  clearTimeout(searchMinigameTimeout);
  $roomSearchedMinigames = res;
}

function handleRemoveMinigame() {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { minigameId: null },
  });
}

function handleReport() {
  if (!$room?.minigame) return;

  reportMinigame();

  // $roomLobbyPopupMessage = { type: "report" };
  // $isModalOpen = true;
}

function kickPlayer(user: number) {
  $roomWs?.send({
    opcode: ClientOpcodes.KICK_PLAYER,
    data: user,
  });
}

function transferHost(user: number) {
  $roomWs?.send({
    opcode: ClientOpcodes.TRANSFER_HOST,
    data: user,
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
  $roomWs?.send({ opcode: ClientOpcodes.BEGIN_GAME, data: null });
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
      try {
        if (["someonesays.io", "www.someonesays.io"].includes(new URL(url).hostname)) {
          return window.open(url, "_blank");
        }
      } catch (err) {}
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
    $launcherDiscordSdk?.commands.openExternalLink({ url: "https://discord.gg/Hce5qUTx5s" });
    return;
  }
}

function reportMinigame() {
  const url = `https://tally.so/r/mKvl5z?minigame_id=${$room?.minigame?.id}`;

  if ($launcher === "normal") {
    window.open(url, "_blank");
  } else if ($launcher === "discord") {
    $launcherDiscordSdk?.commands.openExternalLink({ url });
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
  <Modal style="transform: scale({transformScale}); max-height: calc(80vh / {transformScale});" onclose={() => audio.close.play()}>
    {#if $roomLobbyPopupMessage?.type === "warning"}
      <span class="line-break"></span><span class="line-break"></span>
      <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
      <p>{$roomLobbyPopupMessage?.message}</p>
      <p><button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "link"}
      <span class="line-break"></span><span class="line-break"></span>
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
        <button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {:else if $roomLobbyPopupMessage?.type === "invite"}
      <span class="line-break"></span><span class="line-break"></span>
      <div class="modal-icon"><Copy color="#000000" /></div>
      <p>Copied invite link!</p>
      <p><a class="url disabled-no-pointer" data-sveltekit-preload-data="off" href={`${location.origin}/join/${$room?.room.id}`} onclick={evt => evt.preventDefault()} tabindex=-1>{location.origin}/join/{$room?.room.id}</a></p>
      <p><button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "credits"}
      <h2 style="width: 400px; max-width: 100%;">Credits for "{shortenedMinigameName}"</h2>
      <p class="credits-text">
        <SvelteMarkdown renderers={{
          html: MarkdownDisabled,
          image: MarkdownDisabled,
          link: MarkdownLink,
        }} source={$room?.minigame?.credits} />
      </p>
      <p><button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "select-minigame"}
      <h2 style="width: 400px; max-width: 100%;">Select a minigame using an ID</h2>

      <form onsubmit={setSettingsForm}>
        <input class="input" type="text" name="minigame_id" placeholder="Minigame ID" value={$room?.minigame?.id ?? ""} disabled={$roomRequestedToChangeSettings} maxlength="50">

        <span class="line-break"></span><span class="line-break"></span>
        <input class="primary-button wait-on-disabled" type="submit" value="Set minigame" disabled={$roomRequestedToChangeSettings}>
        <button class="secondary-button margin-top-8px" data-audio-type="close" onclick={(evt) => { evt.preventDefault(); $isModalOpen = false }}>Close</button>
      </form>
      <span class="line-break"></span>
    {:else if $roomLobbyPopupMessage?.type === "select-minigame-search"}
      <h2 style="width: 400px; max-width: 100%;">Select minigame</h2>
      
      <input class="input" type="text" placeholder="Search minigames..." maxlength="100" bind:value={searchMinigameQuery} oninput={handleSearchingMinigames}>

      <span class="line-break"></span><span class="line-break"></span>

      <div class="select-minigame-container" class:center={!$roomSearchedMinigames?.minigames.length}>
        {#if !$roomSearchedMinigames}
          <div class="loading-animation large" style="margin-bottom: 12px;"></div>
          <span>Loading...</span>
        {:else if !$roomSearchedMinigames.success}
          <div class="modal-icon" style="margin-bottom: 24px;">
            <TriangleExclamation color="#000000" />
          </div>
          <span>Failed to fetch minigames...</span>
        {:else if $roomSearchedMinigames.minigames.length === 0}
          <div class="modal-icon" style="margin-bottom: 24px;">
            <TriangleExclamation color="#000000" />
          </div>
          <span>Couldn't find any minigames...</span>
        {:else}
          {#each $roomSearchedMinigames.minigames as minigame}
            <div>
              <button class="select-minigame-button" disabled={$roomRequestedToChangeSettings} onclick={() => setSettings({ minigameId: minigame.id })}>
                
                <div class="preview-image">
                  {#if minigame?.iconImage}
                    <img class="preview-image image-fade-in" alt="Minigame preview" src={
                      $launcher === "normal"
                        ? minigame.iconImage.normal
                        : minigame.iconImage.discord
                    } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
                  {/if}
                </div>
                <div class="featured-minigame-text">
                  {minigame.name}
                </div>
              </button>
            </div>
          {/each}
        {/if}
      </div>
      <span class="line-break"></span>

      {#if !removeIdsOption}
        <button class="primary-button" onclick={(evt) => { evt.preventDefault(); handleSelectMinigame(); }} tabindex={disableTabIndex}>
          Select minigame using an ID
        </button>
      {/if}

      <button class="secondary-button margin-top-8px" data-audio-type="close" onclick={(evt) => { evt.preventDefault(); $isModalOpen = false; }}>Close</button>
      <span class="line-break"></span><span class="line-break"></span>
    {:else if $roomLobbyPopupMessage?.type === "report"}
      <h2>Report minigame</h2>
      <p>This UI is a work in progress!</p>
      <p><button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Close</button></p>
    {:else if $roomLobbyPopupMessage?.type === "mobile"}
      <span class="line-break"></span><span class="line-break"></span>
      <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
      <p>
        This minigame doesn't support mobile devices!<span class="line-break"></span>
        Do you wish to continue?
      </p>
      <p>
        <button class="primary-button margin-top-8px wait-on-disabled" onclick={() => startGame(true)}>Start</button>
        <button class="secondary-button margin-top-8px" data-audio-type="close" onclick={() => $isModalOpen = false}>Cancel</button>
      </p>
    {/if}
  </Modal>

  <div class="app">
    <div class="app-section" style="transform: scale({transformScale}); height: {transformScale === 1 ? "100%" : `${window.innerHeight / transformScale}px`};">
      <div class="nav-container">
        <div class="leave">
          {#if $launcher === "normal"}
            <button class="button leave" data-audio-type="close" onclick={leaveGame} tabindex={disableTabIndex}>
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
              <span class="line-break"></span>
              <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} onmousedown={() => audio.press.play()} ontouchstart={() => audio.press.play()} tabindex={disableTabIndex} />
            </div>
          </div>

          {#if $launcher === "discord"}
            <a href="https://discord.gg/Hce5qUTx5s" onclick={joinDiscordServer} target="_blank">
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
                    
                    {#if $room.room.host === $room.user && $room.user !== player.id}
                      <div class="player-actions">
                        <div>
                          {#if $launcher === "normal"}
                            <button class="error-button margin-top-8px playeraction-button kick" onclick={() => kickPlayer(player.id)} tabindex={disableTabIndex}>Kick</button>
                          {/if}
                          <button class="secondary-button margin-top-8px playeraction-button transfer-host" onclick={() => transferHost(player.id)} tabindex={disableTabIndex}>Transfer Host</button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}
              <span class="line-break"></span>
            </div>
          </div>
        </div>
        <div class="game-container" class:hidden={activeView !== 'game'}>
          <div class="game-section">
            {#if $room}
              {#if $room.minigame}
                <div class="options-container load-fade-in" class:loaded={$room}>
                  <div class="options-section">
                    <div>
                      <div class="options-name">A minigame has been selected!</div>
                    </div>
                  </div>
                  <div class="select-container">
                    {#if $room.minigame.credits}
                      <button class="secondary-button select-button" onclick={handleCredits} tabindex={disableTabIndex}>
                        Credits
                      </button>
                    {/if}
                    {#if $room.room.host === $room.user}
                      <button class="primary-button select-button" onclick={handleSelectMinigameSearch} tabindex={disableTabIndex}>
                        Change minigame
                      </button>
                      <button class="error-button select-button wait-on-disabled" data-audio-type="close" onclick={handleRemoveMinigame} disabled={$roomRequestedToChangeSettings} tabindex={disableTabIndex}>
                        Remove
                      </button>
                    {/if}
  
                    {#if !$room.minigame.official}
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
                    <p class="nextup-minigame-description">
                      <SvelteMarkdown renderers={{
                        html: MarkdownDisabled,
                        image: MarkdownDisabled,
                        link: MarkdownLink,
                      }} source={$room?.minigame?.description} />
                    </p>
                  </div>
                  <div class="nextup-minigame-preview">
                    {#if $room.minigame?.previewImage}
                      <img class="nextup-minigame-preview-image image-fade-in" alt="Minigame preview" src={$launcher === "normal" ? $room.minigame.previewImage.normal : $room.minigame.previewImage.discord} onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
                    {/if}
                  </div>
                </div>
                
                <div class="nextup-minigame-legal-container">
                  {#if $room.minigame.privacyPolicy || $room.minigame.termsOfServices}
                    <p class="nextup-minigame-legal">The developer of <b>{shortenedMinigameName}</b>'s
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
                  {:else}
                    <p class="nextup-minigame-legal">This is an official minigame from Someone Says.</p>
                  {/if}
                </div>
              {:else}
                <div class="nothingselected-container load-fade-in" class:loaded={$room}>
                  {#if $room && $room.user === $room.room.host}
                    <h2>Choose a featured minigame to play!</h2>

                    <RoomLobbyFeaturedMinigames tabindex={disableTabIndex} />
                    <span class="line-break"></span>

                    <div class="nothingselected-buttons">
                      <button class="secondary-button nothingselected-button" onclick={handleSelectMinigameSearch} tabindex={disableTabIndex} disabled={$room.user !== $room.room.host || $roomRequestedToChangeSettings}>
                        Select another minigame
                      </button>
                    </div>
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
  .player-card.client-is-host:hover .player-name {
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
  .options-section {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    overflow: auto;
    margin-top: 12px;
    margin-bottom: 6px;
  }
  .options-name {
    font-weight: bold;
  }
  .select-container {
    display: flex;
    gap: 5px;
    overflow: auto;
  }

  .select-button.secondary-button {
    width: 65px;
  }
  .select-button.primary-button {
    width: 130px;
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
  .nextup-minigame-legal-container {
    margin-top: 6px;
  }
  .nextup-minigame-legal {
    font-size: 0.8rem;
  }
  .nextup-minigame-preview {
    border: 1px #b3b3b3 solid;
    background: var(--card-stroke);
    margin-left: 12px;
    width: 50%;
    max-width: 325px;
    max-height: 325px;

    border-radius: 15px;
    aspect-ratio: 1 / 1;
    float: right;
    overflow: auto;
  }
  .nextup-minigame-preview-image {
    border-radius: 15px;
    width: 100%;
    height: auto;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1 / 1;
    float: right;
    overflow: auto;
  }

  .action-container {
    gap: 1rem;
    overflow: auto;
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
  .action-button {
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap;
    flex: 1;
    transition: 0.3s;
  }
  .action-button {
    padding: 0.75rem 1.5rem;
    height: 50px;
    font-size: 18px;
  }
  .action-button:active {
    top: 1px;
  }
  .action-button.invite {
    background: var(--primary-button);
    color: var(--primary);
  }
  .action-button.invite:hover {
    background-color: var(--primary-button-hover);
  }
  .action-button.invite:click {
    background-color: var(--primary-button-hover);
  }
  .action-button.start {
    background: var(--success-button);
    color: var(--primary);
  }
  .action-button.start:hover {
    background-color: #19713e;
  }

  .select-minigame-container.center {
    align-items: center;
    justify-content: center;
  }
  .select-minigame-container {
    display: flex;
    width: 400px;
    height: 200px;
    max-width: 100%;
    gap: 3px;
    overflow: auto;
    flex-direction: column;
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
  .featured-minigame-text {
    text-align: left;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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

  .credits-text {
    white-space: pre-line;
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
