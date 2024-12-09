<script lang="ts">
import env from "$lib/utils/env";
import { onMount } from "svelte";
import { launcher } from "$lib/components/stores/home/launcher";
import { ClientOpcodes, type ApiGetPacks } from "@/public";
import { isModalOpen } from "$lib/components/stores/home/modal";
import {
  room,
  roomFeaturedPacks,
  roomLobbyPopupMessage,
  roomRequestedToChangeSettings,
  roomWs,
} from "$lib/components/stores/home/roomState";

let { tabindex = 0 } = $props();

onMount(() => {
  getFeaturedPacks();
});

async function getFeaturedPacks() {
  let url: string;
  switch ($launcher) {
    case "normal":
      url = `${env.VITE_BASE_API}/api/packs?featured=true`;
      break;
    case "discord":
      url = `/.proxy/api/packs?featured=true`;
      break;
    default:
      throw new Error("Invalid launcher for getFeaturedPacks");
  }

  try {
    const res = await fetch(url);
    const packMinigames = (await res.json()) as ApiGetPacks;

    if (!res.ok) throw new Error("Failed to load featured packs (response is not OK)");

    $roomFeaturedPacks = { success: true, packs: packMinigames.packs };
  } catch (err) {
    console.error(err);

    $roomFeaturedPacks = { success: false, packs: [] };

    $roomLobbyPopupMessage = { type: "warning", message: "Failed to load featured packs." };
    $isModalOpen = true;
  }
}

// (copy and pasted from RoomLobbyContainer)
function setSettings({ packId = null, minigameId = null }: { packId?: string | null; minigameId?: string | null }) {
  $roomRequestedToChangeSettings = true;
  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: { packId, minigameId },
  });
}
</script>

{#if $roomFeaturedPacks?.success}
  {#if $roomFeaturedPacks.packs.length}
    <div class="featured-container">
      {#each $roomFeaturedPacks.packs as pack}
        <button class="featured-pack-container loaded" onclick={() => setSettings({ packId: pack.id })} tabindex={tabindex} disabled={!$room || $room.user !== $room.room.host || $roomRequestedToChangeSettings}>
          <div class="pack-image featured">
            {#if pack?.iconImage}
              <img class="pack-image featured image-fade-in" alt="Pack icon" src={
                $launcher === "normal"
                  ? pack.iconImage.normal
                  : pack.iconImage.discord
              } onload={(el) => (el.target as HTMLImageElement).classList.add("image-fade-in-loaded")} />
            {/if}
          </div>
          <div class="featured-pack-text">
            {pack.name}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <p>There are no featured packs currently!</p>
  {/if}
{:else if $roomFeaturedPacks?.success === false}
  <p>Failed to load featured packs!</p>
{:else}
  <div class="featured-container">
    <div class="featured-pack-container loading">
      <div class="pack-image featured loading"></div>
      <div class="featured-pack-text">&nbsp;</div>
    </div>
    <!-- <div class="featured-pack-container loading">
      <div class="pack-image featured loading second"></div>
      <div class="featured-pack-text">&nbsp;</div>
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
  .featured-pack-container {
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
  .featured-pack-container.loaded:hover {
    cursor: pointer;
    background-color: var(--secondary);
    transform: scale(1.02);
  }
  .featured-pack-container.loaded:disabled {
    cursor: wait;
  }
  .featured-pack-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    min-width: 7rem;
    width: 7rem;

    white-space: nowrap;

    animation-name: pack-fade-in;
    animation-duration: 0.2s;
    animation-timing-function: ease-out;
  }
  .pack-image.featured {
    margin-right: 0;

    min-width: 7rem;
    min-height: 7rem;
    width: 7rem;
    height: 7rem;
  }
  .pack-image.featured.loading {
    animation-name: featured-loading;
    animation-duration: 3s;
    animation-iteration-count: infinite;
  }
  /* .pack-image.featured.loading.second {
    animation-delay: 1.5s;
  } */

  @keyframes pack-fade-in {
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