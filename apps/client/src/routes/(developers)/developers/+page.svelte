<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { user, token } from "$lib/stores/developers/cache";
import type { ApiGetUserMinigames } from "@/public";

let failedToLogin = $state(false);
let message = $state<{ state: "success" | "failed"; text: string } | null>(null);

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
  try {
    const minigamesResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames?limit=100`, {
      headers: { authorization: $token },
    });
    if (!minigamesResponse.ok) return false;

    minigames = await minigamesResponse.json();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function createMinigame() {
  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/minigames`, {
      method: "POST",
      headers: { authorization: $token, "content-type": "application/json" },
      body: JSON.stringify({
        name: "[add your minigame name here]",
      }),
    });

    if (!res.ok) throw new Error("The request was not OK");

    const id = (await res.json()).id;
    return goto(`/developers/minigames/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error(err);
    message = { state: "failed", text: "Failed to create minigame." };
  }
}

async function logoutAllSessions() {
  try {
    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me/sessions`, {
      method: "DELETE",
      headers: { authorization: $token },
    });

    if (!res.ok) throw new Error("The request was not OK");

    $token = "";
    $user = null;

    return goto("/");
  } catch (err) {
    message = { state: "failed", text: "Failed to logout of all sessions." };
  }
}
</script>

<main class="main-container">
  <div class="developer-container">
    {#if failedToLogin}
    <p>
      <a class="url" href="/">
        <button class="secondary-button" style="max-width: 50px;">
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
      <p>
        <a class="url" href="/">
          <button class="secondary-button" style="max-width: 50px;">
            Back
          </button>
        </a>
      </p>

      <h1>Welcome back, {$user?.name}!</h1>

      <div>
        Check out the MinigameSdk here:
        <a class="url" href="https://www.npmjs.com/package/@someonesays/minigame-sdk" target="_blank">https://www.npmjs.com/package/@someonesays/minigame-sdk</a>
      </div>
      <div>
        And join our Discord server to ask for help!
        <a class="url" href="https://discord.gg/Hce5qUTx5s" target="_blank">https://discord.gg/Hce5qUTx5s</a>
      </div>

      <p>
        <a href="/developers/settings">
          <button class="secondary-button" style="max-width: 75px;">
            Settings
          </button>
        </a>
        <button class="error-button" style="max-width: 64px;" onclick={logoutAllSessions}>
          Logout
        </button>
      </p>

      <hr class="border" />

      {#if message?.state === "failed"}
        <span class="line-break"></span>
        <div class="failed-message">{message.text}</div>
      {:else if message?.state === "success"}
        <span class="line-break"></span>
        <div class="success-message">{message.text}</div>
      {/if}

      <h2>Minigames</h2>
      <div>
        <button class="success-button" style="max-width: 125px;" onclick={createMinigame}>Create minigame</button>
      </div>
      <span class="line-break"></span>
      {#each minigames.minigames as minigame}
        <div>
          <a class="url light" href="/developers/minigames/{minigame.id}">
            {minigame.name}
          </a>
        </div>
      {/each}

      <span class="line-break"></span>
    {:else}
      <a class="url" href="/">
        <button class="secondary-button" style="max-width: 50px;">
          Back
        </button>
      </a>

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
    word-wrap: break-word
  }
</style>
