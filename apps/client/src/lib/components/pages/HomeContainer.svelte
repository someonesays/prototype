<script lang="ts">
import env from "$lib/utils/env";

import Avatar from "$lib/components/elements/cards/Avatar.svelte";

import Ban from "$lib/components/icons/Ban.svelte";
import Logo from "$lib/components/icons/Logo.svelte";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import Modal from "$lib/components/elements/cards/Modal.svelte";

import { onMount } from "svelte";
import { Turnstile } from "svelte-turnstile";

import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/state";
import { MatchmakingLocation, ErrorMessageCodesToText, RoomWebsocket, ErrorMessageCodes } from "@/public";

import { displayName, shape, color, roomIdToJoin, kickedReason } from "$lib/stores/home/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import { isMobileOrTablet } from "$lib/utils/mobile";
import { isModalOpen } from "$lib/stores/home/modal";

import { launcherMatchmaking } from "$lib/stores/home/launcher";
import { getFeaturedMinigames } from "$lib/utils/minigames";

import { audio } from "$lib/utils/audio";
import { shapes } from "$lib/utils/avatars";
import { colors } from "$lib/utils/avatars";

let disableJoinPage = $state(false);
let loadedRoomToJoin = $derived(!page.url.pathname.startsWith("/join/") || !!$roomIdToJoin);
let disableJoin = $derived(disableJoinPage || !loadedRoomToJoin);

let turnstileInvisibleSuccessOnce = $state(false);
let triedInvisible = $state(!env.VITE_TURNSTILE_SITE_KEY_INVISIBLE);
let turnstileIsInvisibleLoading = $derived(
  !triedInvisible && !turnstileInvisibleSuccessOnce && !env.VITE_TURNSTILE_BYPASS_SECRET,
);
let resetTurnstile = $state<() => void>();
let resetTurnstileInvisible = $state<() => void>();

let saveSamePageKickedReason = $state<string | null>(null);
let transformScale = $state(1);

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $roomIdToJoin = null;
  $isModalOpen = false;
  $kickedReason = saveSamePageKickedReason;
});

// Handle joining room
async function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (disableJoinPage) return;
  disableJoinPage = true;

  audio.press.play();

  const form = new FormData(evt.target as HTMLFormElement);

  $displayName = form.get("displayName") as string;
  setCookie("displayName", $displayName);

  setCookie("shape", $shape);
  setCookie("color", $color);

  if (turnstileIsInvisibleLoading) {
    // This is a really hacky way to check if the invisible captcha is still loading...
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (turnstileIsInvisibleLoading) return;

        clearInterval(interval);
        resolve(true);
      }, 500);
    });
  }

  const formCaptcha = new FormData(evt.target as HTMLFormElement); // Reget the form for captcha
  const type = env.VITE_TURNSTILE_BYPASS_SECRET ? "bypass" : triedInvisible ? "managed" : "invisible";
  const token = env.VITE_TURNSTILE_BYPASS_SECRET ?? (formCaptcha.get("cf-turnstile-response") as string);

  if (!(await getFeaturedMinigames())) {
    disableJoinPage = false;
    $isModalOpen = true;
    $kickedReason = "Failed to connect. Check your internet connection.";
    return;
  }

  // Get room from matchmaking
  const {
    success,
    code,
    data: matchmaking,
  } = await RoomWebsocket.getMatchmaking({
    captcha: { type, token },
    displayName: $displayName,
    shape: $shape,
    color: $color,
    location: MatchmakingLocation.USA,
    roomId: $roomIdToJoin ?? undefined,
    mobile: isMobileOrTablet(),
    baseUrl: env.VITE_BASE_API,
  });

  resetTurnstile?.();
  resetTurnstileInvisible?.();

  if (!success) {
    // Allow clicking join again
    disableJoinPage = false;
    // Disable invisible widget if captcha fails
    if (code === ErrorMessageCodes.FAILED_CAPTCHA) {
      triedInvisible = true;
    }
    // Set kick reason
    $isModalOpen = true;
    $kickedReason = ErrorMessageCodesToText[code];
    // If is ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT, don't go to "/".
    if ([ErrorMessageCodes.FAILED_CAPTCHA, ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT].includes(code)) return;
    // Redirect page to "/" if it's not already that
    if (location.pathname !== "/") {
      saveSamePageKickedReason = ErrorMessageCodesToText[code];
      goto("/");
    }
    return;
  }

  // Remove failed reason
  $kickedReason = null;
  saveSamePageKickedReason = null;

  // Set matchmaking JWT
  $launcherMatchmaking = matchmaking;

  // Goto to room page
  goto(`/rooms/${encodeURIComponent($roomIdToJoin ?? "new")}`);
}

onMount(() => {
  if ($kickedReason) {
    $isModalOpen = true;
  }

  $displayName = $displayName ?? getCookie("displayName").slice(0, 32);

  const resize = () => {
    if (window.innerWidth >= 1100 && window.innerHeight >= 660) {
      transformScale = Math.min(window.innerWidth / 1100, window.innerHeight / 660);
    } else {
      transformScale = 1;
    }
  };
  window.addEventListener("resize", resize);
  resize();

  return () => {
    window.removeEventListener("resize", resize);
  };
});

function changeShape(dir: boolean) {
  audio.press.play();
  if (dir) {
    let index = shapes.indexOf($shape) + 1;
    if (index >= shapes.length) index = 0;
    $shape = shapes[index];
  } else {
    let index = shapes.indexOf($shape) - 1;
    if (index < 0) index = shapes.length - 1;
    $shape = shapes[index];
  }
}

function changeColor(dir: boolean) {
  audio.press.play();
  if (dir) {
    let index = colors.indexOf($color) + 1;
    if (index >= colors.length) index = 0;
    $color = colors[index];
  } else {
    let index = colors.indexOf($color) - 1;
    if (index < 0) index = colors.length - 1;
    $color = colors[index];
  }
}
</script>

<Modal style="transform: scale({transformScale}); max-height: calc(80vh / {transformScale});" onclose={() => audio.close.play()}>
  <br><br>
  <div class="modal-icon"><Ban color="#000000" /></div>
  <p>{$kickedReason}</p>
  <p><button class="secondary-button margin-top-8px" onclick={() => {$isModalOpen = false; audio.close.play();}}>Close</button></p>
</Modal>

<div class="main-container">
  <BaseCard style="padding: 20px; transform: scale({transformScale});">
    <br>
    
    <div class="logo-container">
      <Logo />
    </div>

    <p class="indev-warning">
      This game is still in development!<br>Check out the <a class="url discord" href="https://discord.gg/Hce5qUTx5s" target="_blank">Discord server</a> if you're curious.
    </p>

    <div class="avatar-container">
      <div class="avatar-option-container">
        <button class="avatar-option" onclick={() => changeShape(false)} disabled={disableJoinPage}>←</button>
        <button class="avatar-option" onclick={() => changeColor(false)} disabled={disableJoinPage}>←</button>
      </div>
      <div class="image-container">
        <Avatar shape={$shape} color={$color} />
      </div>
      <div class="avatar-option-container">
        <button class="avatar-option" onclick={() => changeShape(true)} disabled={disableJoinPage}>→</button>
        <button class="avatar-option" onclick={() => changeColor(true)} disabled={disableJoinPage}>→</button>
      </div>
    </div>

    <form onsubmit={joinRoom}>
      <input class="input input-center" type="text" name="displayName" bind:value={$displayName} placeholder="Nickname" minlength="1" maxlength="32" disabled={disableJoinPage} required>
      <input class="primary-button margin-top-8 wait-on-disabled" type="submit" value={(page.url.pathname.startsWith("/join/") ? (disableJoinPage ? "Joining room..." : "Join room") : (disableJoinPage ? "Creating room..." :"Create room"))} disabled={disableJoin}><br>
      
      {#if !env.VITE_TURNSTILE_BYPASS_SECRET}
        {#if triedInvisible}
          <div class="captcha-container">
            <div class="captcha">
              <Turnstile siteKey={env.VITE_TURNSTILE_SITE_KEY} bind:reset={resetTurnstile} />
            </div>
          </div>
        {:else}
          <Turnstile siteKey={env.VITE_TURNSTILE_SITE_KEY_INVISIBLE} on:callback={() => turnstileInvisibleSuccessOnce = true} on:error={() => triedInvisible = true} on:expired={() => triedInvisible = true} bind:reset={resetTurnstileInvisible} />
        {/if}
      {/if}
    </form>

    <p>
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/developers" onclick={(evt) => {if (disableJoin) evt.preventDefault()}}>Developer Portal</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/credits" onclick={(evt) => {if (disableJoin) evt.preventDefault()}}>Credits</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/terms" onclick={(evt) => {if (disableJoin) evt.preventDefault()}}>Terms of Services</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/privacy" onclick={(evt) => {if (disableJoin) evt.preventDefault();}}>Privacy Policy</a>
    </p>
  </BaseCard>
</div>

<style>
  .indev-warning {
    background-color: var(--error-button);
    color: #fafafa;
    padding: 15px;
    border-radius: 6px;
  }
  .url.discord {
  color: #c4bbff;
  }
  .url.discord:hover {
    color: #fafafa;
  }

  .main-container {
    display: flex;
    flex-direction: column;
    overflow: auto;
    min-width: 100px;
    min-height: 100px;
    align-items: safe center;
    justify-content: safe center;
    text-align: center;
    height: 100%;
    overflow: auto;
    margin: 0 auto;
  }
  .logo-container {
    max-width: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  .margin-top-8 {
    margin-top: 8px;
  }
  .captcha-container {
    margin-top: 10px;
    height: 65px;
  }

  .avatar-container {
    display: flex;
    justify-content: center;
    align-items: center;
    align-items: center;
    margin-bottom: 15px;
  }
  .image-container {
    border-radius: 100px;
    border: solid #fafafa 3px;
    transition: 0.4s ease-out;
  }
  .avatar-option-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 10px;
  }
  .avatar-option {
    border: none;
    background-color: #fafafa;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
    border-radius: 100px;
    padding: 10px;
    cursor: pointer;
    transition: 0.1s ease-out;
  }
  .avatar-option:hover {
    background-color: #ffffff;
    box-shadow: 0 6px 6px rgba(0, 0, 0, 0.1);
    transform: scale(1.002);
  }
  .avatar-option:active {
    transform: translate(0, 1px);
  }
</style>
