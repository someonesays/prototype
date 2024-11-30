<script lang="ts">
import env from "$lib/utils/env";

import { Turnstile } from "svelte-turnstile";

import { beforeNavigate, goto } from "$app/navigation";
import { MatchmakingLocation, ErrorMessageCodesToText, RoomWebsocket } from "@/public";

import { displayName, roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import { isMobileOrTablet } from "$lib/utils/mobile";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { launcherMatchmaking } from "../stores/launcher";

let limitJoin = $state(false);

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $roomIdToJoin = null;
  $kickedReason = null;
});

// Handle joining room
async function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (limitJoin) return;
  limitJoin = true;

  const form = new FormData(evt.target as HTMLFormElement);
  const captcha = form.get("cf-turnstile-response") as string;

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
    limitJoin = false;
    // Set kick reason
    $kickedReason = `Failed to connect to matchmaking: ${ErrorMessageCodesToText[code]}`;
    // Redirect page to "/" if it's not already that
    if (location.pathname !== "/") goto("/");
    return;
  }

  // Set matchmaking JWT
  $launcherMatchmaking = matchmaking;

  // Goto to room page
  goto(`/rooms/${encodeURIComponent($roomIdToJoin ?? "new")}`);
}
</script>

<div style="width: 50%; height: 300px;">
  <BaseCard>
    {#if $kickedReason}
      <p class="kicked">{$kickedReason}</p>
    {/if}
    
    <p>Someone Says</p>
    <form onsubmit={joinRoom}>
      <input type="text" name="displayName" value={$displayName || getCookie("displayName")} placeholder="Nickname" minlength="1" maxlength="32" required>
      <input type="submit" value={$roomIdToJoin ? "Join room" : "Create room"}><br>
      {#if env.VITE_IS_PROD}
        <Turnstile siteKey={env.VITE_TURNSTILE_SITE_KEY} />
      {/if}
    </form>

    <p><a href="/developers">Developer Portal</a></p>
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
