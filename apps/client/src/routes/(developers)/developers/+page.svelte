<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { getCookie } from "$lib/utils/cookies";
import type { ApiGetUserMinigames, ApiGetUserPacks, ApiGetUserMe } from "@/public";

let user = $state<ApiGetUserMe["user"] | null>(null);
let minigames = $state<ApiGetUserMinigames>({ offset: 0, limit: 0, total: 0, minigames: [] });
let packs = $state<ApiGetUserPacks>({ offset: 0, limit: 0, total: 0, packs: [] });

onMount(() => {
  (async () => {
    const userResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
      headers: { authorization: getCookie("token") },
    });
    const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
      headers: { authorization: getCookie("token") },
    });
    const packsResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs`, {
      headers: { authorization: getCookie("token") },
    });

    if (!userResponse.ok || !minigamesResponse.ok || !packsResponse.ok) {
      window.location.href = `${env.VITE_BASE_API}/api/auth/discord/login${env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "?local=true" : ""}`;
      return;
    }

    user = (await userResponse.json()).user;
    minigames = await minigamesResponse.json();
    packs = await packsResponse.json();
  })();
});

async function createMinigame() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
    method: "POST",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: JSON.stringify({
      name: "[add your minigame name here]",
    }),
  });
  if (!res.ok) return alert("Failed to create minigame");

  const id = (await res.json()).id;
  return goto(`/developers/minigames/${encodeURIComponent(id)}`);
}

async function createPack() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs`, {
    method: "POST",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: JSON.stringify({
      name: "[add your pack name here]",
    }),
  });
  if (!res.ok) return alert("Failed to create pack");

  const id = (await res.json()).id;
  return goto(`/developers/packs/${encodeURIComponent(id)}`);
}

async function updateUser(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const name = form.get("name") as string;

  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
    method: "PATCH",
    headers: { authorization: getCookie("token"), "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return alert("Failed to update user");

  return alert("Successfully updated user");
}

async function logoutAllSessions() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/sessions`, {
    method: "DELETE",
    headers: { authorization: getCookie("token") },
  });
  if (!res.ok) return alert("Failed to logout of all sessions");

  return goto("/");
}
</script>

<main>
  <p><a href="/">Back</a></p>
  <form onsubmit={updateUser}>
    <label for="name">Name:</label>
    <input name="name" value={user?.name}>
    <input type="submit">
  </form>
  <p><button onclick={logoutAllSessions}>Logout from all sessions</button></p>
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
