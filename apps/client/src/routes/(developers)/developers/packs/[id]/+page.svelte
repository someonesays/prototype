<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { getCookie } from "$lib/utils/cookies";
import type { ApiGetUserPack, ApiGetUserPackMinigames } from "@/public";

const packId = $page.params.id;

let pack = $state<ApiGetUserPack["pack"]>();
let packMinigames = $state<ApiGetUserPackMinigames>();

onMount(() => {
  (async () => {
    if (!(await refreshStates())) return goto("/developers");
  })();
});

async function refreshStates() {
  const packResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(packId)}`, {
    headers: { authorization: getCookie("token") },
  });
  const packMinigamesResponse = await fetch(
    `${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(packId)}/minigames`,
    {
      headers: { authorization: getCookie("token") },
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
  const input = form.get("input") as string;

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}`, {
    method: "PATCH",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: input,
  });

  alert(await res.text());
  refreshStates();
}

async function deletePack() {
  if (!pack) throw new Error("Pack hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}`, {
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

async function addMinigame(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  if (!pack) throw new Error("Pack hasn't loaded yet");

  const form = new FormData(evt.target as HTMLFormElement);
  const id = form.get("id") as string;

  const res = await fetch(
    `${env.VITE_BASE_API}/api/users/@me/packs/${encodeURIComponent(pack.id)}/minigames/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: { authorization: getCookie("token") },
    },
  );

  alert(await res.text());
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
      headers: { authorization: getCookie("token") },
    },
  );

  alert(await res.text());
  refreshStates();
}
</script>
  
<main>
  <p><a class="url" href="/developers">Back</a></p>
  {#if !pack || !packMinigames}
    <p>Loading...</p>
  {:else}
    <h2>Pack: {pack.name}</h2>

    <p><button onclick={deletePack}>Delete pack</button></p>

    <h3>Modify pack</h3>
    <form onsubmit={savePack}>
      Note: You cannot change the id, authorId, publishType and createdAt value.<br>
      <textarea name="input" rows="5" cols="100">{JSON.stringify(pack)}</textarea><br>
      <button type="submit">Save</button>
    </form>
    
    <h3>Manage minigames in the pack</h3>
    <p>{JSON.stringify(packMinigames)}</p>

    <h4>Add minigame</h4>
    <form onsubmit={addMinigame}>
      <input name="id" minlength="1" required>
      <button type="submit">Add</button>
    </form>

    <h4>Remove minigame</h4>
    <form onsubmit={removeMinigame}>
      <input name="id" minlength="1" required>
      <button type="submit">Remove</button>
    </form>
  {/if}
</main>
