<script lang="ts">
import env from "$lib/utils/env";

import Modal from "$lib/components/elements/cards/Modal.svelte";
import TriangleExclamation from "$lib/components/icons/TriangleExclamation.svelte";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { isModalOpen } from "$lib/stores/home/modal";
import { token } from "$lib/stores/developers/cache";
import type { ApiGetUserPack, ApiGetUserPackMinigames } from "@/public";

const packId = $page.params.id;

let pack = $state<ApiGetUserPack["pack"]>();
let packMinigames = $state<ApiGetUserPackMinigames>();

onMount(() => {
  $isModalOpen = false;

  (async () => {
    if (!(await refreshStates())) return goto("/developers");
  })();
});

async function refreshStates() {
  const packResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(packId)}`, {
    headers: { authorization: $token },
  });
  const packMinigamesResponse = await fetch(
    `${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(packId)}/minigames`,
    {
      headers: { authorization: $token },
    },
  );
  if (!packResponse.ok || !packMinigamesResponse.ok) return false;

  pack = (await packResponse.json()).pack;
  packMinigames = await packMinigamesResponse.json();

  return true;
}

async function savePack(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!pack) throw new Error("Pack hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);

  const name = form.get("name") as string;
  const description = form.get("description") as string;
  const iconImage = (form.get("iconImage") as string) || null;
  const randomize = Boolean(form.get("randomize") as string);

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}`, {
    method: "PATCH",
    headers: { authorization: $token, "content-type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      iconImage,
      randomize,
    }),
  });

  if (!res.ok) return alert(await res.text());

  alert("Success!");
  refreshStates();
}

function deletePack() {
  $isModalOpen = true;
}

async function deletePackConfirm() {
  if (!pack) throw new Error("Pack hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}`, {
    method: "DELETE",
    headers: { authorization: $token },
  });
  const output = await res.json();

  if (!res.ok) return alert(output);
  return goto("/developers");
}

async function addMinigame(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!pack) throw new Error("Pack hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);
  const id = form.get("id") as string;

  const res = await fetch(
    `${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}/minigames/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: { authorization: $token },
    },
  );

  if (!res.ok) return alert(await res.text());

  alert("Success!");
  refreshStates();
}

async function removeMinigame(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!pack) throw new Error("Pack hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);
  const id = form.get("id") as string;

  const res = await fetch(
    `${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}/minigames/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { authorization: $token },
    },
  );

  if (!res.ok) return alert(await res.text());

  alert("Success!");
  refreshStates();
}
</script>

<Modal>
  <br><br>
  <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
  <p>Are you sure you want to delete this pack?</p>

  <p>
    <button class="error-button" onclick={deletePackConfirm}>Delete</button>
    <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
  </p>
</Modal>

<main class="main-container">
  <div class="developer-container">
    <p style="display: flex; gap: 5px;">
      <a class="url" href="/developers">
        <button class="secondary-button">
          Back
        </button>
      </a>
    </p>
    
    {#if !pack || !packMinigames}
      <p>Loading...</p>
    {:else}
      <h2>Pack: {pack.name}</h2>

      <h3>Modify pack</h3>
      <form onsubmit={savePack}>
        <label for="name">Name:</label>
        <input class="input" name="name" bind:value={pack.name}>

        <br><br>

        <label for="description">Description:</label>
        <br>
        <textarea class="input" name="description" rows="5" bind:value={pack.description}></textarea>

        <br><br>

        <label for="iconImage">Icon image URL:</label>
        <input class="input" name="iconImage" bind:value={pack.iconImage}>

        <br><br>

        <label for="randomize">Randomize:</label>
        <input type="checkbox" name="randomize" bind:checked={pack.randomize}>

        <br><br>
        
        <button class="success-button" type="submit">Save pack</button>
      </form>

      <h3>Manage minigames in the pack</h3>

      <h4>Add minigame</h4>
      <form onsubmit={addMinigame}>
        <input class="input" name="id" minlength="1" required>
        <br><br>
        <button class="primary-button" type="submit">Add minigame</button>
      </form>

      <h4>Remove minigame</h4>
      <form onsubmit={removeMinigame}>
        <input class="input" name="id" minlength="1" required>
        <br><br>
        <button class="error-button" type="submit">Remove minigame</button>
      </form>

      <br>
      <h4>These are the minigames in the pack:</h4>

      {#each packMinigames?.minigames ?? [] as minigame}
        <div>
          <a class="url" href="/developers/minigames/{minigame.id}">{minigame?.name}</a>
        </div>
      {/each}

      {#if !packMinigames?.minigames.length}
        <span>There are no minigame in this pack currently!</span>
      {/if}

      <br>
      <h3>Dangerous actions</h3>
      <p>These actions are dangerous and not undoable.</p>

      <p>
        <button class="error-button" onclick={deletePack}>Delete pack</button>
      </p>
    {/if}
  </div>
</main>

<style>
  .main-container {
    background-color: #090a0c;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 20px;
  }
  .developer-container {
    background-color: rgb(29, 30, 32);
    border-radius: 15px;
    padding: 20px;
    display: flex;
    text-align: center;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
</style>
