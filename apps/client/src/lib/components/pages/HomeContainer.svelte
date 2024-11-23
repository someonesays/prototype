<script lang="ts">
import { Turnstile } from "svelte-turnstile";

import { beforeNavigate, goto } from "$app/navigation";
import { MatchmakingLocation, MessageCodesToText, ParentSdk } from "@/public";

import { displayName, roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import {
  VITE_IS_PROD,
  VITE_BASE_API,
  VITE_TURNSTILE_SITE_KEY_INVISIBLE,
  VITE_TURNSTILE_SITE_KEY_MANAGED,
} from "$lib/utils/env";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { launcherMatchmaking } from "../stores/launcher";

let visibleCaptcha = $state(false);
let enableJoinButton = $state(!VITE_IS_PROD);

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $roomIdToJoin = null;
  $kickedReason = null;
});

// Handle joining room
async function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const token = form.get("cf-turnstile-response") as string;

  $displayName = form.get("display_name") as string;
  setCookie("display_name", $displayName);

  // Get room from matchmaking
  const {
    success,
    code,
    data: matchmaking,
  } = await ParentSdk.getMatchmaking({
    captcha: {
      type: visibleCaptcha ? "managed" : "invisible",
      token,
    },
    displayName: $displayName,
    location: MatchmakingLocation.USA,
    roomId: $roomIdToJoin ?? undefined,
    baseUrl: VITE_BASE_API,
  });

  if (!success) {
    // Set kick reason
    $kickedReason = `Failed to connect to matchmaking: ${MessageCodesToText[code]}`;
    // Redirect page to "/" if it's not already that
    if (location.pathname !== "/") goto("/");
    return;
  }

  // Set matchmaking JWT
  $launcherMatchmaking = matchmaking;

  // Goto to room page
  goto(`/rooms/${encodeURIComponent($roomIdToJoin ?? "new")}`);
}

function showCaptcha() {
  visibleCaptcha = true;
  setJoinButtonState(true);
}

function setJoinButtonState(state: boolean) {
  enableJoinButton = state;
}
</script>

<div style="width: 50%; height: 300px;">
  <BaseCard>
    {#if $kickedReason}
      <p class="kicked">{$kickedReason}</p>
    {/if}
    
    <p>Someone Says</p>
    <form onsubmit={joinRoom}>
      <input type="text" name="display_name" value={$displayName || getCookie("display_name")} placeholder="Nickname" minlength="1" maxlength="32" required>
      <input type="submit" value={$roomIdToJoin ? "Join room" : "Create room"} disabled={!enableJoinButton}><br>
      {#if VITE_IS_PROD}
        {#if visibleCaptcha}
          <Turnstile siteKey={VITE_TURNSTILE_SITE_KEY_MANAGED} />
        {:else}
          <Turnstile siteKey={VITE_TURNSTILE_SITE_KEY_INVISIBLE} on:callback={() => setJoinButtonState(true)} on:error={showCaptcha} on:expired={showCaptcha} />
        {/if}
      {/if}
    </form>

    <p><a href="/credits">Credits</a></p>
    <p><a href="/terms">Terms of Services</a></p>
    <p><a href="/privacy">Privacy Policy</a></p>
  </BaseCard>
</div>
  
<style>
  .kicked {
    color: var(--error-button);
  }
</style>
