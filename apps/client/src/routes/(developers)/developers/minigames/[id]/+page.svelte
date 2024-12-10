<script lang="ts">
import env from "$lib/utils/env";

import Modal from "$lib/components/elements/cards/Modal.svelte";
import TriangleExclamation from "$lib/components/icons/TriangleExclamation.svelte";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { isModalOpen } from "$lib/stores/home/modal";
import { token } from "$lib/stores/developers/cache";
import type { ApiGetUserMinigame } from "@/public";

const minigameId = $page.params.id;
let minigame = $state<ApiGetUserMinigame["minigame"]>();

onMount(() => {
  $isModalOpen = false;

  (async () => {
    if (!(await refreshStates())) return goto("/developers");
  })();
});

async function refreshStates() {
  const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigameId)}`, {
    headers: { authorization: $token },
  });
  if (!minigamesResponse.ok) return false;

  minigame = (await minigamesResponse.json()).minigame;
  return true;
}

async function saveMinigame(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);

  const name = form.get("name") as string;
  const description = form.get("description") as string;
  const previewImage = form.get("previewImage") as string;
  const termsOfServices = form.get("termsOfServices") as string;
  const privacyPolicy = form.get("privacyPolicy") as string;
  const proxyUrl = form.get("proxyUrl") as string;
  const pathType = Number.parseInt(form.get("pathType") as string);
  const minimumPlayersToStart = Number.parseInt(form.get("minimumPlayersToStart") as string);
  const supportsMobile = Boolean(form.get("supportsMobile"));

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
    method: "PATCH",
    headers: { authorization: $token, "content-type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      previewImage,
      termsOfServices,
      privacyPolicy,
      proxyUrl,
      pathType,
      minimumPlayersToStart,
      supportsMobile,
    }),
  });

  if (!res.ok) return alert(await res.text());

  alert("Success!");
  refreshStates();
}

function deleteMinigame() {
  $isModalOpen = true;
}

async function deleteMinigameConfirm() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
    method: "DELETE",
    headers: { authorization: $token },
  });

  if (res.ok) return goto("/developers");
}

async function regenTestingAccessCode() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}/reset`, {
    method: "POST",
    headers: { authorization: $token, "content-type": "application/json" },
    body: JSON.stringify({ location: "usa" }), // There is a location option for resetting the access code
  });

  if (!res.ok) return alert(await res.text());

  alert("Success!");
  refreshStates();
}
</script>

<Modal>
  <br><br>
  <div class="modal-icon"><TriangleExclamation color="#000000" /></div>
  <p>Are you sure you want to delete this minigame?</p>

  <p>
    <button class="error-button" onclick={deleteMinigameConfirm}>Delete</button>
    <button class="secondary-button margin-top-8px" onclick={() => $isModalOpen = false}>Cancel</button>
  </p>
</Modal>

<main class="main-container">
  <div class="developer-container">
    <p><a class="url" href="/developers">Back</a></p>
    {#if !minigame}
      <p>Loading...</p>
    {:else}
      <h2>Minigame: {minigame.name}</h2>

      <p style="text-align: center;">
        Testing access code: <u>{minigame.testingAccessCode}</u>
        <br><br>
        <button class="error-button" onclick={regenTestingAccessCode}>Reset testing access code</button>
      </p>

      <h3>Modify minigame</h3>
      <form onsubmit={saveMinigame}>
        <label for="name">Name:</label>
        <input class="input" name="name" bind:value={minigame.name}>

        <br><br>

        <label for="description">Description:</label>
        <br>
        <textarea class="input" name="description" rows="5" bind:value={minigame.description}></textarea>

        <br><br>

        <label for="previewImage">Preview image URL:</label>
        <input class="input" name="previewImage" bind:value={minigame.previewImage}>

        <br><br>

        <label for="termsOfServices">Terms of Services:</label>
        <input class="input" name="termsOfServices" bind:value={minigame.termsOfServices}>

        <br><br>
        
        <label for="privacyPolicy">Privacy Policy:</label>
        <input class="input" name="privacyPolicy" bind:value={minigame.privacyPolicy}>

        <br><br>
        
        <label for="proxyUrl">Proxy URL:</label>
        <input class="input" name="proxyUrl" bind:value={minigame.proxyUrl}>

        <br><br>
        
        <label for="pathType">Path type:</label>
        <select class="input" name="pathType">
          <option value="0" selected={minigame.pathType === 0}>Original</option>
          <option value="1" selected={minigame.pathType === 1}>Whole path</option>
        </select>

        <br><br>
        
        <label for="minimumPlayersToStart">Minimum players to start:</label>
        <input class="input" name="minimumPlayersToStart" bind:value={minigame.minimumPlayersToStart}>

        <br><br>

        <label for="supportsMobile">Supports mobile:</label>
        <input type="checkbox" name="supportsMobile" bind:checked={minigame.supportsMobile}>

        <br><br>
        
        <button class="success-button" type="submit">Save minigame</button>
      </form>

      <h3>Dangerous actions</h3>
      <p>These actions are dangerous and not undoable.</p>

      <p>
        <button class="error-button" onclick={deleteMinigame}>Delete minigame</button>
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
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
</style>
