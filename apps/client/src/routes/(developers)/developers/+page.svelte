<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { user, token } from "$lib/stores/developers/cache";
import type { ApiGetUserMinigames, ApiGetUserPacks } from "@/public";

let minigames = $state<ApiGetUserMinigames>({ offset: 0, limit: 0, total: 0, minigames: [] });
let packs = $state<ApiGetUserPacks>({ offset: 0, limit: 0, total: 0, packs: [] });

onMount(() => {
  (async () => {
    if (!$token) {
      window.location.href = `${env.VITE_BASE_API}/api/auth/discord/login${env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "?local=true" : ""}`;
      return;
    }

    if (!$user) {
      const userResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
        headers: { authorization: $token },
      });

      if (!userResponse.ok) {
        window.location.href = `${env.VITE_BASE_API}/api/auth/discord/login${env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "?local=true" : ""}`;
        return;
      }

      $user = (await userResponse.json()).user;
    }

    fetchMinigames();
    fetchPacks();
  })();
});

async function fetchMinigames() {
  // TODO: Support pagination
  const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
    headers: { authorization: $token },
  });
  if (!minigamesResponse.ok) return false;

  minigames = await minigamesResponse.json();
  return true;
}

async function fetchPacks() {
  // TODO: Support pagination
  const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/packs`, {
    headers: { authorization: $token },
  });
  if (!minigamesResponse.ok) return false;

  packs = await minigamesResponse.json();
  return true;
}

async function createMinigame() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
    method: "POST",
    headers: { authorization: $token, "content-type": "application/json" },
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
    headers: { authorization: $token, "content-type": "application/json" },
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
    headers: { authorization: $token, "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return alert("Failed to update user");

  return alert("Successfully updated user");
}

async function logoutAllSessions() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/sessions`, {
    method: "DELETE",
    headers: { authorization: $token },
  });
  if (!res.ok) return alert("Failed to logout of all sessions");

  return goto("/");
}
</script>

<main class="main-container">
  <div class="developer-container">
    <p style="display: flex; gap: 5px;">
      <a class="url" href="/">
        <button class="secondary-button">
          Back
        </button>
      </a>
      <button class="error-button" onclick={logoutAllSessions}>
        Logout
      </button>
    </p>

    <h1>Welcome back, {$user?.name}!</h1>

    <form onsubmit={updateUser}>
      <input class="input input-center" value={$user?.name}>
      <input class="primary-button" type="submit" value="Change username">
    </form>

    <h2>Minigames</h2>
    <button class="success-button" onclick={createMinigame}>Create minigame</button>
    <br>
    {#each minigames.minigames as minigame}
      <div>
        <a class="url light" href="/developers/minigames/{minigame.id}">
          {minigame.name}
        </a>
      </div>
    {/each}
  
    <h2>Packs</h2>
    <button class="success-button" onclick={createPack}>Create pack</button>
    <br>
    {#each packs.packs as pack}
      <div>
        <a class="url light" href="/developers/packs/{pack.id}">
          {pack.name}
        </a>
      </div>
    {/each}
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
