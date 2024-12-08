<script lang="ts">
import env from "$lib/utils/env";
import { onMount } from "svelte";
import { launcher } from "$lib/components/stores/launcher";
import { ClientOpcodes, type ApiGetPacks, type Pack } from "@/public";
import { roomLobbyPopupMessage, roomRequestedToChangeSettings, roomWs } from "$lib/components/stores/roomState";
import { isModalOpen } from "$lib/components/stores/modal";

let featuredPacks = $state<{ success: boolean; packs: Pack[] } | null>(null);

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

    featuredPacks = { success: true, packs: packMinigames.packs };
  } catch (err) {
    console.error(err);

    featuredPacks = { success: false, packs: [] };

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

{#if featuredPacks?.success}
  {#if featuredPacks.packs.length}
    <div class="featured-container">
      {#each featuredPacks.packs as pack}
        <button class="featured-pack-container" onclick={() => setSettings({ packId: pack.id })}>
          <div class="pack-image featured">
            {#if pack?.iconImage}
              <img class="pack-image featured" alt="Pack icon" src={
                $launcher === "normal"
                  ? pack.iconImage.normal
                  : pack.iconImage.discord
              } />
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
{:else if featuredPacks?.success === false}
  <p>Failed to load featured packs!</p>
{:else}
  <p>Loading featured packs...</p>
{/if}

<style>
  .featured-container {
    display: flex;
    justify-content: safe center;
    gap: 12px;
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
    cursor: pointer;
    transition: 0.2s;
  }
  .featured-pack-container:hover {
    background-color: var(--secondary);
    transform: scale(1.02);
  }
  .pack-image.featured {
    margin-right: 0;
    
    min-width: 6rem;
    min-height: 6rem;
    width: 6rem;
    height: 6rem;
  }
</style>