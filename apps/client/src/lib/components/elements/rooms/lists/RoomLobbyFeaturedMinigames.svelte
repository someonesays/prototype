<script lang="ts">
import { launcher } from "$lib/stores/home/launcher";
import { ClientOpcodes } from "@/public";
import { room, roomFeaturedMinigames, roomRequestedToChangeSettings, roomWs } from "$lib/stores/home/roomState";

let { tabindex = 0 } = $props();

// (copy and pasted from RoomLobbyContainer.svelte)
function setSettings({ minigameId = null }: { minigameId?: string | null }) {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { minigameId },
  });
}
</script>

{#if $roomFeaturedMinigames?.success}
  {#if $roomFeaturedMinigames.minigames.length}
    <div class="featured-container">
      {#each $roomFeaturedMinigames.minigames as minigame}
        <button class="featured-minigame-container loaded" onclick={() => setSettings({ minigameId: minigame.id })} tabindex={tabindex} disabled={!$room || $room.user !== $room.room.host || $roomRequestedToChangeSettings}>
          <div class="preview-image featured">
            {#if minigame?.iconImage}
              <img class="preview-image featured image-fade-in" alt="Minigame preview" src={
                $launcher === "normal"
                  ? minigame.iconImage.normal
                  : minigame.iconImage.discord
              } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
            {/if}
          </div>
          <div class="featured-minigame-text">
            {minigame.name.length > 30 ? `${minigame.name.slice(0, 30 - 3)}...` : minigame.name}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <p>There are no featured minigames currently!</p>
  {/if}
{:else}
  <p>Failed to load featured minigames!</p>
{/if}


<style>
  .featured-container {
    display: flex;
    justify-content: safe center;
    gap: 12px;
    flex-flow: row wrap;
  }
  .featured-minigame-container {
    background: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1px transparent solid;
    border-radius: 15px;
    transition: 0.2s;
  }
  .featured-minigame-container.loaded:hover {
    cursor: pointer;
    background-color: var(--secondary);
    transform: scale(1.02);
  }
  .featured-minigame-container.loaded:disabled {
    cursor: wait;
  }
  .featured-minigame-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    min-width: 7rem;

    animation-name: minigames-fade-in;
    animation-duration: 0.2s;
    animation-timing-function: ease-out;
  }

  @keyframes minigames-fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @keyframes featured-loading {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
</style>