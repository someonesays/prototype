<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { user, token } from "$lib/stores/developers/cache";
import type { ApiGetUserMinigames } from "@/public";

let failedToLogin = $state(false);

let minigames = $state<ApiGetUserMinigames>({ offset: 0, limit: 0, total: 0, minigames: [] });

onMount(() => {
  (async () => {
    if (!$token) {
      if (page.url.pathname !== "/developers") return;

      failedToLogin = true;
      return;
    }

    if (!$user) {
      const userResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
        headers: { authorization: $token },
      });

      if (!userResponse.ok) {
        if (page.url.pathname !== "/developers") return;

        failedToLogin = true;
        return;
      }

      $user = (await userResponse.json()).user;
    }

    fetchMinigames();
  })();
});

async function fetchMinigames() {
  const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames?limit=100`, {
    headers: { authorization: $token },
  });
  if (!minigamesResponse.ok) return false;

  minigames = await minigamesResponse.json();
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
  if (!res.ok) return alert("Failed to create minigame.");

  const id = (await res.json()).id;
  return goto(`/developers/minigames/${encodeURIComponent(id)}`);
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
  if (!res.ok) return alert("Failed to update user.");

  return alert("Successfully updated user!");
}

async function logoutAllSessions() {
  const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/sessions`, {
    method: "DELETE",
    headers: { authorization: $token },
  });
  if (!res.ok) return alert("Failed to logout of all sessions.");

  $token = "";
  $user = null;

  return goto("/");
}
</script>

<main class="main-container">
  <div class="developer-container">
    {#if failedToLogin}
      <p style="display: flex; gap: 5px;">
        <a class="url" href="/">
          <button class="secondary-button">
            Back
          </button>
        </a>
      </p>
      
      <h2>Developer portal - Login</h2>
      <p>You can login into the developer portal here!</p>
      <p>
        <a href="{env.VITE_BASE_API}/api/auth/discord/login{env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "?local=true" : ""}">
          <button class="primary-button">
            Login with Discord
          </button>
        </a>
      </p>
    {:else if $user}
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

      <div>
        Check out the MinigameSdk here:
        <a class="url" href="https://www.npmjs.com/package/@someonesays/minigame-sdk" target="_blank">https://www.npmjs.com/package/@someonesays/minigame-sdk</a>
      </div>
      <div>
        And join our Discord server to ask for help!
        <a class="url" href="https://discord.gg/zVWekYCEC9" target="_blank">https://discord.gg/zVWekYCEC9</a>
      </div>

      <br><br>

      <form onsubmit={updateUser}>
        <input class="input input-center" name="name" value={$user?.name}>
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

      <br>
    {:else}
      <p style="display: flex; gap: 5px;">
        <a class="url" href="/">
          <button class="secondary-button">
            Back
          </button>
        </a>
      </p>

      <p>Loading...</p>
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
    overflow: hidden;
  }
</style>
