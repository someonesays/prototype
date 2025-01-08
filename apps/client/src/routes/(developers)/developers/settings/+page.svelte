<script lang="ts">
import env from "$lib/utils/env";

import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { user, token } from "$lib/stores/developers/cache";

let message = $state<{ state: "success" | "failed"; text: string } | null>(null);
let displayNameEditMultiplier = $state(0);

onMount(() => {
  (async () => {
    if (!$token) return goto("/developers");

    if (!$user) {
      const userResponse = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
        headers: { authorization: $token },
      });

      if (!userResponse.ok) return goto("/developers");
      $user = (await userResponse.json()).user;
    }
  })();
});

async function updateUser(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  try {
    evt.preventDefault();

    const form = new FormData(evt.target as HTMLFormElement);
    const name = form.get("name") as string;

    const res = await fetch(`${env.VITE_BASE_API}/api/users/@me`, {
      method: "PATCH",
      headers: { authorization: $token, "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) throw new Error("The request was not OK");

    displayNameEditMultiplier++;
    message = {
      state: "success",
      text: `Successfully updated user!${displayNameEditMultiplier !== 1 ? ` (x${displayNameEditMultiplier})` : ""}`,
    };
  } catch (err) {
    console.error(err);

    displayNameEditMultiplier = 0;
    message = { state: "failed", text: "Failed to update user." };
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
    displayNameEditMultiplier = 0;
    message = { state: "failed", text: "Failed to logout of all sessions." };
  }
}
</script>

<main class="main-container">
  <div class="developer-container">
    {#if $user}
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
        <a href="/developers">
          <button class="secondary-button" style="max-width: 85px;">
            Minigames
          </button>
        </a>
        <button class="error-button" style="max-width: 64px;" onclick={logoutAllSessions}>
          Logout
        </button>
      </p>

      <hr class="border" />
      <span class="line-break"></span>

      {#if message?.state === "failed"}
        <div class="failed-message">{message.text}</div>
        <span class="line-break"></span>
      {:else if message?.state === "success"}
        <div class="success-message">{message.text}</div>
        <span class="line-break"></span>
      {/if}

      <form onsubmit={updateUser}>
        <label for="name">Display name:</label><span class="line-break"></span><span class="line-break"></span>
        <input class="input input-center input-dark" style="max-width: 200px;" name="name" value={$user?.name} maxlength="32" required>
        <input class="primary-button" style="max-width: 125px;" type="submit" value="Change username">
      </form>
      
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
