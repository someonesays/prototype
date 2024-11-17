<script lang="ts">
import { beforeNavigate, goto } from "$app/navigation";

import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";

import { displayName, roomIdToJoin, kickedReason } from "$lib/components/stores/lobby";
import { getCookie, setCookie } from "$lib/utils/cookies";

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $roomIdToJoin = null;
  $kickedReason = null;
});

// Handle joining room
function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  $displayName = form.get("display_name") as string;

  setCookie("display_name", $displayName);
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

    <p><a href="/terms">Terms of Services</a></p>
    <p><a href="/privacy">Privacy Policy</a></p>
  </BaseCard>
</div>
  
<style>
  .kicked {
    color: var(--error-button);
  }
</style>
