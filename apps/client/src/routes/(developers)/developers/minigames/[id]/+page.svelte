<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { getCookie } from "$lib/utils/cookies";
import type { ApiGetUserMinigame } from "@/public";

const minigameId = $page.params.id;
let minigame = $state<ApiGetUserMinigame["minigame"]>();

onMount(() => {
  (async () => {
    if (!(await refreshStates())) return goto("/developers");
  })();
});

async function refreshStates() {
  const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigameId)}`, {
    headers: { authorization: getCookie("token") },
  });
  if (!minigamesResponse.ok) return false;

  minigame = (await minigamesResponse.json()).minigame;
  return true;
}

async function saveMinigame(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);
  const input = form.get("input") as string;

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
    method: "PATCH",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: input,
  });

  alert(await res.text());
  refreshStates();
}

async function deleteMinigame() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
    method: "DELETE",
    headers: { authorization: getCookie("token") },
  });
  const output = await res.json();

  if (res.ok) {
    goto("/developers");
  } else {
    alert(output);
  }
}

async function regenTestingAccessCode() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}/reset`, {
    method: "POST",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: JSON.stringify({ location: "usa" }), // There is a location option for resetting the access code
  });

  alert(await res.text());

  refreshStates();
}
</script>

<main>
  <p><a href="/developers">Back</a></p>
  {#if !minigame}
    <p>Loading...</p>
  {:else}
    <h2>Minigame: {minigame.name}</h2>

    <p>
      Testing access code: <u>{minigame.testingAccessCode}</u>
      <button onclick={regenTestingAccessCode}>Reset</button>
    </p>

    <p><button onclick={deleteMinigame}>Delete minigame</button></p>

    <h3>Modify minigame</h3>
    <form onsubmit={saveMinigame}>
      Note: You cannot change the id, authorId, publishType, testingLocation, testingAccessCode and createdAt value.<br>
      <textarea name="input" rows="20" cols="100">{JSON.stringify(minigame)}</textarea><br>
      <button type="submit">Save</button>
    </form>
  {/if}
</main>
