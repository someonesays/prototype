<script lang="ts">
import { beforeNavigate, goto } from "$app/navigation";
import BaseCard from "$lib/components/elements/cards/BaseCard.svelte";
import { kickedReason } from "$lib/components/stores/kickedReason";

// Remove kicked reason if you leave the page
beforeNavigate(() => {
  $kickedReason = null;
});

// Handle joining room
function joinRoom(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const roomId = form.get("room_id") as string;

  goto(`/rooms/${encodeURIComponent(roomId)}`);
}
</script>
  
<div style="width: 50%; height: 300px;">
  <BaseCard>
    {#if $kickedReason}
      <p class="kicked">{$kickedReason}</p>
    {/if}
    
    <p>Someone Says</p>
    <p><a href="/rooms/new"><button>Create room</button></a></p>
    <form on:submit={joinRoom}>
      <label for="room_id">Join room:</label>
      <input type="text" id="room_id" name="room_id" placeholder="Room ID" minlength="8" maxlength="8" required>
      <input type="submit" value="Submit">
    </form>

    <p><a href="/legal/terms">Terms of Services</a></p>
    <p><a href="/legal/privacy">Privacy Policy</a></p>
  </BaseCard>
</div>
  
<style>
  .kicked {
    color: var(--error-button);
  }
</style>
