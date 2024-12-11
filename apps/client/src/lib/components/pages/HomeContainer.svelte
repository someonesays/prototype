<script lang="ts">
import env from "$lib/utils/env";

import Ban from "$lib/components/icons/Ban.svelte";
import Logo from "$lib/components/icons/Logo.svelte";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import Modal from "$lib/components/elements/cards/Modal.svelte";

import { onMount } from "svelte";
import { Turnstile } from "svelte-turnstile";

import { beforeNavigate, goto } from "$app/navigation";
import { page } from "$app/stores";
import { MatchmakingLocation, ErrorMessageCodesToText, RoomWebsocket, ErrorMessageCodes } from "@/public";

import { displayName, roomIdToJoin, kickedReason } from "$lib/stores/home/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import { isMobileOrTablet } from "$lib/utils/mobile";
import { isModalOpen } from "$lib/stores/home/modal";

import { launcherMatchmaking } from "$lib/stores/home/launcher";

let disableJoinPage = $state(false);
let loadedRoomToJoin = $derived(!$page.url.pathname.startsWith("/join/") || !!$roomIdToJoin);
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

  const form = new FormData(evt.target as HTMLFormElement);

  $displayName = form.get("displayName") as string;
  setCookie("displayName", $displayName);

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

  // Get room from matchmaking
  const {
    success,
    code,
    data: matchmaking,
  } = await RoomWebsocket.getMatchmaking({
    captcha: { type, token },
    displayName: $displayName,
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
    $kickedReason = saveSamePageKickedReason = ErrorMessageCodesToText[code];
    // If is ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT, don't go to "/".
    if ([ErrorMessageCodes.FAILED_CAPTCHA, ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT].includes(code)) return;
    // Redirect page to "/" if it's not already that
    if (location.pathname !== "/") goto("/");
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

  $displayName = $displayName ?? getCookie("displayName");

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
</script>

<Modal>
  <br><br>
  <div class="modal-icon"><Ban color="#000000" /></div>
  <p>{$kickedReason}</p>
  <p><button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Close</button></p>
</Modal>

<div class="main-container">
  <BaseCard style="padding: 20px; transform: scale({transformScale});">
    <br>
    <div class="logo-container">
      <Logo />
    </div>
    <br>
    <form onsubmit={joinRoom}>
      <input class="input input-center" type="text" name="displayName" bind:value={$displayName} placeholder="Nickname" minlength="1" maxlength="32" disabled={disableJoinPage} required>
      <input class="primary-button margin-top-8 wait-on-disabled" type="submit" value={($page.url.pathname.startsWith("/join/") ? (disableJoinPage ? "Joining room..." : "Join room") : (disableJoinPage ? "Creating room..." :"Create room"))} disabled={disableJoin}><br>
      
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
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/privacy" onclick={(evt) => {if (disableJoin) evt.preventDefault()}}>Privacy Policy</a>
    </p>
  </BaseCard>
</div>

<style>
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
</style>
