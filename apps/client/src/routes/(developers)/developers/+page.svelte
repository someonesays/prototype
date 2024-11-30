<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import type { ApiGetUserMinigames, ApiGetUserPacks } from "@/public";

let minigames = $state<ApiGetUserMinigames>({ offset: 0, limit: 0, total: 0, minigames: [] });
let packs = $state<ApiGetUserPacks>({ offset: 0, limit: 0, total: 0, packs: [] });

onMount(() => {
  (async () => {
    const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, { credentials: "include" });
    const packsResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs`, { credentials: "include" });

    if (!minigamesResponse.ok || !packsResponse.ok) {
      window.location.href = `${env.VITE_BASE_API}/api/auth/discord/login${env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "?local=true" : ""}`;
      return;
    }

    minigames = await minigamesResponse.json();
    packs = await packsResponse.json();
  })();
});

async function createMinigame() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "[add your minigame name here]",
    }),
    credentials: "include",
  });
  if (!res.ok) return alert("Failed to create minigame");

  const id = (await res.json()).id;
  return goto(`/developers/minigames/${encodeURIComponent(id)}`);
}

async function createPack() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "[add your pack name here]",
    }),
    credentials: "include",
  });
  if (!res.ok) return alert("Failed to create pack");

  const id = (await res.json()).id;
  return goto(`/developers/packs/${encodeURIComponent(id)}`);
}
</script>

<main>
  <p><a href="/">Back</a></p>
  <h2>Minigames</h2>
  <p>{JSON.stringify(minigames)}</p>
  <p><button onclick={createMinigame}>Create minigame</button></p>
  <ul>
    {#each minigames.minigames as minigame}
      <li><a href="/developers/minigames/{minigame.id}">{minigame.name}</a></li>
    {/each}
  </ul>

  <h2>Packs</h2>
  <p>{JSON.stringify(packs)}</p>
  <p><button onclick={createPack}>Create pack</button></p>
  <ul>
    {#each packs.packs as pack}
      <li><a href="/developers/packs/{pack.id}">{pack.name}</a></li>
    {/each}
  </ul>
</main>
