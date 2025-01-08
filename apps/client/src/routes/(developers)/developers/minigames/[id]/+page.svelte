<script lang="ts">
import env from "$lib/utils/env";

import Modal from "$lib/components/elements/cards/Modal.svelte";
import TriangleExclamation from "$lib/components/icons/TriangleExclamation.svelte";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { isModalOpen } from "$lib/stores/home/modal";
import { token } from "$lib/stores/developers/cache";
import {
  type ErrorMessageCodes,
  ErrorMessageCodesToText,
  MinigameOrientation,
  MinigamePathType,
  type ApiGetUserMinigame,
} from "@/public";

let message = $state<{ state: "success" | "failed"; text: string } | null>(null);

const minigameId = page.params.id;
let minigame = $state<ApiGetUserMinigame["minigame"]>();

const validateUrl = (v: string) => /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(v);

onMount(() => {
  $isModalOpen = false;

  (async () => {
    $isModalOpen = false;
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

  try {
    const form = new FormData(evt.target as HTMLFormElement);

    const name = form.get("name") as string;
    const description = form.get("description") as string;
    const credits = form.get("credits") as string;
    const iconImage = (form.get("iconImage") as string) || null;
    const previewImage = (form.get("previewImage") as string) || null;
    const published = Boolean(form.get("published"));
    const termsOfServices = (form.get("termsOfServices") as string) || null;
    const privacyPolicy = (form.get("privacyPolicy") as string) || null;
    const proxyUrl = (form.get("proxyUrl") as string) || null;
    const pathType = Number.parseInt(form.get("pathType") as string);
    const minimumPlayersToStart = Number.parseInt(form.get("minimumPlayersToStart") as string);
    const supportsMobile = Boolean(form.get("supportsMobile"));
    const mobileOrientation = Number.parseInt(form.get("mobileOrientation") as string);

    if (iconImage && !validateUrl(iconImage)) {
      message = { state: "failed", text: "Invalid icon image URL." };
      return;
    }
    if (previewImage && !validateUrl(previewImage)) {
      message = { state: "failed", text: "Invalid preview image URL." };
      return;
    }
    if (termsOfServices && !validateUrl(termsOfServices)) {
      message = { state: "failed", text: "Invalid terms of services URL." };
      return;
    }
    if (privacyPolicy && !validateUrl(privacyPolicy)) {
      message = { state: "failed", text: "Invalid privacy policy URL." };
      return;
    }
    if (proxyUrl && !validateUrl(proxyUrl)) {
      message = { state: "failed", text: "Invalid proxy URL." };
      return;
    }

    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
      method: "PATCH",
      headers: { authorization: $token, "content-type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        credits,
        iconImage,
        previewImage,
        published,
        termsOfServices,
        privacyPolicy,
        proxyUrl,
        pathType,
        minimumPlayersToStart,
        supportsMobile,
        mobileOrientation,
      }),
    });

    if (!res.ok) {
      const { code } = await res.json();
      message = { state: "failed", text: ErrorMessageCodesToText[code as ErrorMessageCodes] };
      return;
    }

    message = { state: "success", text: "Successfully saved the minigame's settings." };
    refreshStates();
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to save the minigame's settings." };
  }
}

function deleteMinigame() {
  $isModalOpen = true;
}

async function deleteMinigameConfirm() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
      method: "DELETE",
      headers: { authorization: $token },
    });

    if (res.ok) {
      $isModalOpen = false;
      return goto("/developers");
    }
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to delete the minigame." };
  }
}

async function regenTestingAccessCode() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}/reset`, {
      method: "POST",
      headers: { authorization: $token, "content-type": "application/json" },
      body: JSON.stringify({ location: "usa" }), // There is a location option for resetting the access code
    });

    if (!res.ok) {
      const { code } = await res.json();
      message = { state: "failed", text: ErrorMessageCodesToText[code as ErrorMessageCodes] };
      return;
    }

    message = { state: "success", text: "Successfully regenerated the minigame's testing access code." };
    refreshStates();
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to regenerate the minigame's testing access code." };
  }
}

async function requestToPublishMinigameAccess() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}/review`, {
      method: "POST",
      headers: { authorization: $token },
    });

    if (!res.ok) {
      const { code } = await res.json();
      message = { state: "failed", text: ErrorMessageCodesToText[code as ErrorMessageCodes] };
      return;
    }

    message = { state: "success", text: "Successfully requested to be able to publish your minigame." };
    refreshStates();
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to request to be able to publish your minigame." };
  }
}

async function removeRequestToPublishMinigameAccess() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}/review`, {
      method: "DELETE",
      headers: { authorization: $token },
    });

    if (!res.ok) {
      const { code } = await res.json();
      message = { state: "failed", text: ErrorMessageCodesToText[code as ErrorMessageCodes] };
      return;
    }

    message = { state: "success", text: "Successfully removed the request to be able to publish your minigame." };
    refreshStates();
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to remove the request to be able to publish your minigame." };
  }
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
    <p>
      <a class="url" href="/developers">
        <button class="secondary-button" style="max-width: 50px;">
          Back
        </button>
      </a>
    </p>
    
    {#if !minigame}
      <p>Loading...</p>
    {:else}
      <h2>Minigame: {minigame.name}</h2>

      <p>
        {#if minigame.proxyUrl}
          <a href={`/?minigame_id=${minigame.id}`} target="_blank">
            <button class="primary-button" style="max-width: 110px;">Play minigame</button>
          </a>
        {/if}
        {#if !minigame.canPublish}
          {#if minigame.underReview}
            <button class="error-button" style="max-width: 290px;" onclick={removeRequestToPublishMinigameAccess}>Remove request access to publish minigame</button>
          {:else}
            <button class="success-button" style="max-width: 245px;" onclick={requestToPublishMinigameAccess}>Request access to publish minigame</button>
          {/if}
        {/if}
      </p>

      <p style="text-align: center;">
        ID: <u>{minigame.id}</u><br>
        Testing access code: <u>{minigame.testingAccessCode}</u>
        <br><br>
        <button class="error-button" style="max-width: 180px;" onclick={regenTestingAccessCode}>Reset testing access code</button>
        <button class="error-button" style="max-width: 125px;" onclick={deleteMinigame}>Delete minigame</button>
      </p>

      {#if message?.state === "failed"}
        <p class="failed-message">{message.text}</p>
      {:else if message?.state === "success"}
        <p class="success-message">{message.text}</p>
      {/if}

      <h3>Modify minigame</h3>
      <form onsubmit={saveMinigame}>
        <label for="name">Name:</label>
        <input class="input input-dark" name="name" maxlength="100" value={minigame.name} required>

        <br><br>

        <label for="description">Description:</label>
        <br>
        <textarea class="input textarea input-dark" name="description" rows="8" maxlength="4000" value={minigame.description}></textarea>

        <br><br>

        <label for="credits">Credits:</label>
        <br>
        <textarea class="input textarea input-dark" name="credits" rows="8" maxlength="4000" value={minigame.credits}></textarea>

        <br><br>

        <label for="iconImage">Icon image URL:</label>
        <input class="input input-dark" name="iconImage" type="url" maxlength="999" value={minigame.iconImage}>
        
        <br><br>

        <label for="previewImage">Preview image URL:</label>
        <input class="input input-dark" name="previewImage" type="url" maxlength="999" value={minigame.previewImage}>
        
        <br><br>

        {#if minigame.canPublish}
          <label for="published">Published:</label>
          <input type="checkbox" name="published" checked={minigame.published}>

          <br><br>
        {/if}

        <label for="termsOfServices">Terms of Services:</label>
        <input class="input input-dark" name="termsOfServices" type="url" maxlength="999" value={minigame.termsOfServices}>

        <br><br>
        
        <label for="privacyPolicy">Privacy Policy:</label>
        <input class="input input-dark" name="privacyPolicy" type="url" maxlength="999" value={minigame.privacyPolicy}>

        <br><br>
        
        <label for="proxyUrl">Proxy URL:</label>
        <input class="input input-dark" name="proxyUrl" type="url" maxlength="999" value={minigame.proxyUrl}>

        <br><br>
        
        <label for="pathType">Path type:</label>
        <select class="input input-dark" name="pathType">
          <option value={MinigamePathType.ORIGINAL} selected={minigame.pathType === MinigamePathType.ORIGINAL}>
            Original
          </option>
          <option value={MinigamePathType.WHOLE_PATH} selected={minigame.pathType === MinigamePathType.WHOLE_PATH}>
            Whole path
          </option>
        </select>

        <br><br>
        
        <label for="minimumPlayersToStart">Minimum players to start:</label>
        <input class="input input-dark" name="minimumPlayersToStart" min="1" max="25" value={minigame.minimumPlayersToStart} required>

        <br><br>

        <label for="supportsMobile">Supports mobile:</label>
        <input type="checkbox" name="supportsMobile" checked={minigame.supportsMobile}>

        <br><br>
        
        <label for="mobileOrientation">Mobile orientation (Discord activity only):</label>
        <select class="input input-dark" name="mobileOrientation">
          <option value={MinigameOrientation.NONE} selected={minigame.mobileOrientation === MinigameOrientation.NONE}>
            None
          </option>
          <option value={MinigameOrientation.HORIZONTAL} selected={minigame.mobileOrientation === MinigameOrientation.HORIZONTAL}>
            Horizontal
          </option>
          <option value={MinigameOrientation.PORTRAIT} selected={minigame.mobileOrientation === MinigameOrientation.PORTRAIT}>
            Portrait
          </option>
        </select>

        <br><br>
        
        <button class="success-button" style="max-width: 115px;" type="submit">Save minigame</button>
      </form>
      <br>
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
    word-wrap: break-word;
  }
  .textarea {
    resize: none;
  }
</style>
