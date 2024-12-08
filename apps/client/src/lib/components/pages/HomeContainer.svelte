<script lang="ts">
import env from "$lib/utils/env";

import Ban from "../icons/Ban.svelte";
import Logo from "../icons/Logo.svelte";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import Modal from "../elements/cards/Modal.svelte";

import { onMount } from "svelte";
import { Turnstile } from "svelte-turnstile";

import { beforeNavigate, goto } from "$app/navigation";
import { MatchmakingLocation, ErrorMessageCodesToText, RoomWebsocket, ErrorMessageCodes } from "@/public";

import { displayName, roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import { isMobileOrTablet } from "$lib/utils/mobile";
import { isModalOpen } from "$lib/components/stores/modal";

import { launcherMatchmaking } from "../stores/launcher";

let disableJoin = $state(false);
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

  if (disableJoin) return;
  disableJoin = true;

  const form = new FormData(evt.target as HTMLFormElement);
  const captcha = env.VITE_TURNSTILE_BYPASS_SECRET ?? (form.get("cf-turnstile-response") as string);

  $displayName = form.get("displayName") as string;
  setCookie("displayName", $displayName);

  // Get room from matchmaking
  const {
    success,
    code,
    data: matchmaking,
  } = await RoomWebsocket.getMatchmaking({
    captcha,
    displayName: $displayName,
    location: MatchmakingLocation.USA,
    roomId: $roomIdToJoin ?? undefined,
    mobile: isMobileOrTablet(),
    baseUrl: env.VITE_BASE_API,
  });

  if (!success) {
    // Allow clicking join again
    disableJoin = false;
    // Set kick reason
    $isModalOpen = true;
    $kickedReason = saveSamePageKickedReason = ErrorMessageCodesToText[code];
    // If is ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT, don't go to "/".
    if ([ErrorMessageCodes.FAILED_CAPTCHA, ErrorMessageCodes.REACHED_MAXIMUM_PLAYER_LIMIT].includes(code)) return;
    // Redirect page to "/" if it's not already that
    if (location.pathname !== "/") goto("/");
    return;
  }

  // Set matchmaking JWT
  $launcherMatchmaking = matchmaking;

  // Goto to room page
  goto(`/rooms/${encodeURIComponent($roomIdToJoin ?? "new")}`);
}

onMount(() => {
  if ($kickedReason) {
    $isModalOpen = true;
  }

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
  <div class="modal-icon"><Ban /></div>
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
      <input class="input input-center" type="text" name="displayName" value={$displayName || getCookie("displayName")} placeholder="Nickname" minlength="1" maxlength="32" disabled={disableJoin} required>
      <input class="primary-button margin-top-8" type="submit" value={$roomIdToJoin ? (disableJoin ? "Joining room..." : "Join room") : (disableJoin ? "Creating room..." :"Create room")} disabled={disableJoin}><br>
      {#if env.VITE_IS_PROD && !env.VITE_TURNSTILE_BYPASS_SECRET}
        <div style="margin-top: 10px;">
          <Turnstile siteKey={env.VITE_TURNSTILE_SITE_KEY} />
        </div>
      {/if}
    </form>

    <p>
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/developers">Developer Portal</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/credits">Credits</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/terms">Terms of Services</a>
      &nbsp;&nbsp;
      <a class="url" class:disabled={disableJoin} tabindex={disableJoin ? -1 : 0} href="/privacy">Privacy Policy</a>
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
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
    overflow: auto;
    margin: 0 auto;
  }
  .input-center {
    text-align: center;
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
</style>
