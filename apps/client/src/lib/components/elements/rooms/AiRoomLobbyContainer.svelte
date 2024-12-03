<script lang="ts">
import GearIcon from "$lib/components/icons/GearIcon.svelte";
import DoorOpen from "$lib/components/icons/DoorOpen.svelte";
import Logo from "$lib/components/icons/Logo.svelte";

import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import { room, roomWs } from "$lib/components/stores/roomState";
import { ClientOpcodes } from "@/public";
import { Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let activeView = "minigame";

function setActiveView(view: "minigame" | "players") {
  activeView = view;
}

function setSettings(evt: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  evt.preventDefault();

  const form = new FormData(evt.target as HTMLFormElement);
  const packId = (form.get("pack_id") as string) || null;
  const minigameId = (form.get("minigame_id") as string) || null;

  $roomWs?.send({
    opcode: ClientOpcodes.SET_ROOM_SETTINGS,
    data: {
      packId,
      minigameId,
    },
  });
}

function kickPlayer(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.KICK_PLAYER,
    data: { user },
  });
}

function transferHost(user: string) {
  $roomWs?.send({
    opcode: ClientOpcodes.TRANSFER_HOST,
    data: { user },
  });
}

async function copyInviteLink() {
  try {
    switch ($launcher) {
      case "normal": {
        navigator.clipboard.writeText(`${location.origin}/join/${$room?.room.id}`);
        break;
      }
      case "discord": {
        if (!$launcherDiscordSdk) throw new Error("Missing DiscordSDK. This should never happen.");

        const { permissions } = await $launcherDiscordSdk.commands.getChannelPermissions();
        if (PermissionUtils.can(Permissions.CREATE_INSTANT_INVITE, permissions)) {
          await $launcherDiscordSdk.commands.openInviteDialog();
        } else {
          console.warn("User doesn't have CREATE_INSTANT_INVITE permissions!");
        }

        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function startGame() {
  $roomWs?.send({ opcode: ClientOpcodes.BEGIN_GAME, data: {} });
}

function leaveGame() {
  return $roomWs?.close();
}
</script>
  
{#if $room}
  <div class="app">
    <nav class="top-nav">
      <div class="leave">
        {#if $launcher === "normal"}
          <button class="button leave-button wide" on:click={leaveGame}><DoorOpen /></button>
        {/if}
      </div>
      <div class="nav-buttons">
        <div class="nav-buttons-desktop">
          <Logo />
        </div>
        <div class="nav-buttons-mobile">
          <button class="nav-button" class:active={activeView === 'minigame'} on:click={() => setActiveView('minigame')}>Minigame</button>
          <button class="nav-button" class:active={activeView === 'players'} on:click={() => setActiveView('players')}>Players</button>
        </div>
      </div>
      <div class="settings">
        <button class="button settings-button wide"><GearIcon /></button>
      </div>
    </nav>

    <div class="main-section">
      <div class="players-section" class:hidden={activeView !== 'players'}>
        <h2 class="players-header">Players ({$room.players.length})</h2>
        <div class="players-list">
          {#each $room.players.sort((a, b) => b.points - a.points) as player}
            <div class="player-card">
              <img class="player-avatar" src={player.avatar} alt="{player.displayName}'s avatar" />
              <span class="player-name">
                {player.displayName}
                {#if $room.room.host === player.id}
                  <span class="crown">👑</span>
                {/if}
              </span>
              <span class="player-score">{player.points} point{player.points === 1 ? "" : "s"}</span>
              {#if $room.room.host === $room.user && $room.user !== player.id}
                <div class="player-actions">
                  <button class="button secondary" on:click={() => kickPlayer(player.id)}>Kick</button>
                  <button class="button secondary" on:click={() => transferHost(player.id)}>Transfer Host</button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="game-section" class:hidden={activeView !== 'minigame'}>
        <div class="pack-info">
          {#if $room.pack}
            {#if $room.pack?.iconImage}
              <img class="pack-image" src={$launcher === "normal" ? $room.pack.iconImage.normal : $room.pack.iconImage.discord} alt="Pack icon" />
            {:else}
              <div class="pack-image placeholder"></div>
            {/if}
            <div class="pack-details">
              <h2>{$room.pack.name}</h2>
              <p>by {$room.pack.author.name}</p>
            </div>
            {#if $room.room.host === $room.user}
              <div class="pack-actions">
                <button class="button secondary">Select minigame</button>
                <button class="button primary">Change pack</button>
                <button class="button danger">Remove pack</button>
              </div>
            {/if}
          {:else}
            <div class="pack-details">
              <h2>No pack selected.</h2>
            </div>
            {#if $room.room.host === $room.user}
              <div class="pack-actions">
                <button class="button secondary">Select minigame</button>
                <button class="button primary">Select pack</button>
              </div>
            {/if}
          {/if}

        </div>

        <div class="next-up">
          {#if $room.minigame}
            <h3>NEXT UP</h3>
            <h2>{$room.minigame.name}</h2>
            <p>by {$room.minigame.author.name}</p>
            <p>{$room.minigame.description}</p>
            {#if $room.minigame?.previewImage}
              <img class="minigame-preview" src={$launcher === "normal" ? $room.minigame.previewImage.normal : $room.minigame.previewImage.discord} alt="Minigame preview" />
            {/if}
          {:else}
            <p>[insert pick a pack to play here]</p>
          {/if}

        </div>

        {#if $room.room.host === $room.user}
          <form class="settings-form" on:submit={setSettings}>
            <input type="text" name="pack_id" placeholder="Pack ID" maxlength="18">
            <input type="text" name="minigame_id" placeholder="Minigame ID" maxlength="18">
            <button type="submit" class="button primary">Set pack/minigame</button>
          </form>
        {/if}

        {#if $room.minigame && !$room.minigame.supportsMobile && $room.players.find(p => p.mobile)}
          <p class="warning">WARNING: There is at least one mobile player in this lobby and this minigame doesn't support mobile devices!</p>
        {/if}
      </div>
    </div>

    <div class="footer">
      <button class="button secondary wide" on:click={copyInviteLink}>Invite</button>
      <button class="button primary wide" on:click={startGame} disabled={$room.room.host !== $room.user}>Start</button>
    </div>
  </div>
{:else}
  <div class="loading">
    <Logo />
    <p>Loading lobby...</p>
  </div>
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
  }

  .top-nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    margin-bottom: 1rem;
  }

  .nav-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .nav-buttons-mobile {
    display: block;
  }

  .nav-buttons-desktop {
    display: none;
    width: calc(120px + 4vh);
  }

  .nav-button {
    background: var(--secondary-button);
    border: none;
    color: var(--primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .nav-button.active {
    background: #5e6a77;
  }

  .main-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow: hidden;
  }

  .players-header {
    text-align: center;
  }

  .players-section, .game-section {
    background: var(--primary);
    border-radius: 1rem;
    padding: 1rem;
    color: var(--primary-text);
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: calc(100vh - 250px);
    overflow-y: auto;
  }

  .player-card {
    background: var(--secondary);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  .player-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }

  .player-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .crown {
    font-size: 1rem;
  }

  .player-score {
    font-weight: bold;
  }

  .player-actions {
    display: flex;
    gap: 0.5rem;
  }

  .pack-info {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .pack-image {
    min-width: 4rem;
    min-height: 4rem;
    border-radius: 0.5rem;
    background: var(--card-stroke);
  }

  .pack-details {
    flex: 1;
  }

  .pack-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .next-up {
    margin-top: 1rem;
  }

  .minigame-preview {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .settings-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .settings-form input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--card-stroke);
    border-radius: 0.25rem;
  }

  .footer {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .button {
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .button.wide {
    flex: 1;
  }

  .button.primary {
    background: var(--primary-button);
    color: var(--primary);
  }

  .button.secondary {
    background: var(--secondary-button);
    color: var(--primary);
  }

  .button.danger {
    background: var(--error-button);
    color: var(--primary);
  }

  .leave-button {
    background: var(--leave-button);
    color: white;
    padding: 12px;
    width: 50px;
    height: 50px;
  }

  .settings-button {
    background: var(--secondary-button);
    color: white;
    padding: 12px;
    width: 50px;
    height: 50px;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .warning {
    background: var(--error-button);
    color: var(--primary);
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-top: 1rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: var(--primary-text);
  }

  .loading :global(svg) {
    width: calc(120px + 4vh);
    height: auto;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: var(--primary-text);
  }

  h3 {
    margin: 0;
    color: var(--secondary-text);
    font-size: 0.875rem;
  }

  p {
    margin: 0.5rem 0;
    color: var(--secondary-text);
  }

  .hidden {
    display: none;
  }

  @media (max-width: 900px) {
    .players-section,
    .game-section {
      flex: 1 1 auto;
      height: calc(100vh - 150px);
      overflow-y: auto;
    }
  }

  @media (min-width: 900px) {
    .nav-buttons-mobile {
      display: none;
    }
    .nav-buttons-desktop {
      display: block;
    }

    .hidden {
      display: block;
    }

    .main-section {
      flex-direction: row;
    }

    .players-section {
      flex: 1;
      max-height: calc(100vh - 150px);
      overflow-y: auto;
    }

    .game-section {
      flex: 2;
    }
  }
</style>
