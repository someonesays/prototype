<script lang="ts">
import { beforeNavigate, goto } from "$app/navigation";
import { MatchmakingLocation, MessageCodesToText, ParentSdk } from "@/public";

import { displayName, roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";
import { VITE_BASE_API } from "$lib/utils/env";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { launcherMatchmaking } from "../stores/launcher";

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $roomIdToJoin = null;
  $kickedReason = null;
});

// Handle joining room
async function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  $displayName = form.get("display_name") as string;

  setCookie("display_name", $displayName);

  // Get room from matchmaking
  const {
    success,
    code,
    data: matchmaking,
  } = await ParentSdk.getMatchmaking({
    location: MatchmakingLocation.USA,
    roomId: $roomIdToJoin ?? undefined,
    displayName: $displayName,
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
</script>

<div style="width: 50%; height: 300px;">
  <BaseCard>
    {#if $kickedReason}
      <p class="kicked">{$kickedReason}</p>
    {/if}
    
    <p>Someone Says</p>
    <form onsubmit={joinRoom}>
      <input type="text" name="display_name" value={$displayName || getCookie("display_name")} placeholder="Nickname" minlength="1" maxlength="32" required>
      <input type="submit" value={$roomIdToJoin ? "Join room" : "Create room"}>
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
