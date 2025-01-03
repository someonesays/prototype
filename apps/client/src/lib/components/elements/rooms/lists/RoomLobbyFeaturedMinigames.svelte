<script lang="ts">
import env from "$lib/utils/env";
import { onMount } from "svelte";
import { launcher } from "$lib/stores/home/launcher";
import { ClientOpcodes, type ApiGetMinigames } from "@/public";
import { isModalOpen } from "$lib/stores/home/modal";
import {
  room,
  roomFeaturedMinigames,
  roomLobbyPopupMessage,
  roomRequestedToChangeSettings,
  roomWs,
} from "$lib/stores/home/roomState";

let { tabindex = 0 } = $props();

onMount(() => {
  getFeaturedMinigames();
});

async function getFeaturedMinigames() {
  let url: string;
  switch ($launcher) {
    case "normal":
      url = `${env.VITE_BASE_API}/api/minigames?featured=true`;
      break;
    case "discord":
      url = `/.proxy/api/minigames?featured=true`;
      break;
    default:
      throw new Error("Invalid launcher for getFeaturedMinigames");
  }

  try {
    const res = await fetch(url);
    const featuredMinigames = (await res.json()) as ApiGetMinigames;

    if (!res.ok) throw new Error("Failed to load featured minigames (response is not OK)");

    $roomFeaturedMinigames = { success: true, minigames: featuredMinigames.minigames };
  } catch (err) {
    console.error(err);

    $roomFeaturedMinigames = { success: false, minigames: [] };

    $roomLobbyPopupMessage = { type: "warning", message: "Failed to load featured minigames." };
    $isModalOpen = true;
  }
}

// (copy and pasted from RoomLobbyContainer)
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
            {#if minigame?.previewImage}
              <img class="preview-image featured image-fade-in" alt="Minigame preview" src={
                $launcher === "normal"
                  ? minigame.previewImage.normal
                  : minigame.previewImage.discord
              } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
            {/if}
          </div>
          <div class="featured-minigame-text">
            {minigame.name}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <p>There are no featured minigames currently!</p>
  {/if}
{:else if $roomFeaturedMinigames?.success === false}
  <p>Failed to load featured minigames!</p>
{:else}
  <div class="featured-container">
    <div class="featured-minigame-container loading">
      <div class="preview-image featured loading"></div>
      <div class="featured-minigame-text">
        &nbsp;
      </div>
    </div>
    <!-- <div class="featured-minigame-container loading">
      <div class="preview-image featured loading second"></div>
      <div class="featured-minigame-text">
        &nbsp;
      </div>
    </div> -->
  </div>
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
    width: 7rem;

    height: 18px;

    white-space: nowrap;

    animation-name: minigames-fade-in;
    animation-duration: 0.2s;
    animation-timing-function: ease-out;
  }
  /* .preview-image.featured.loading.second {
    animation-delay: 1.5s;
  } */

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