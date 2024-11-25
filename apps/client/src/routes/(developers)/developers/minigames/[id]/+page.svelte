<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
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
    credentials: "include",
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
    headers: { "content-type": "application/json" },
    body: input,
    credentials: "include",
  });

  alert(await res.text());
  refreshStates();
}

async function deleteMinigame() {
  if (!minigame) throw new Error("Minigame hasn't loaded yet");

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames/${encodeURIComponent(minigame.id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const output = await res.json();

  if (res.ok) {
    goto("/developers");
  } else {
    alert(output);
  }
}
</script>

<main>
  <p><a href="/developers">Back</a></p>
  {#if !minigame}
    <p>Loading...</p>
  {:else}
    <h2>Minigame: {minigame.name}</h2>

    <p><button onclick={deleteMinigame}>Delete minigame</button></p>

    <h3>Modify minigame</h3>
    <form onsubmit={saveMinigame}>
      Note: You cannot change the id, authorId, publishType and createdAt value.<br>
      <textarea name="input" rows="20" cols="100">{JSON.stringify(minigame)}</textarea><br>
      <button type="submit">Save</button>
    </form>
  {/if}
</main>
