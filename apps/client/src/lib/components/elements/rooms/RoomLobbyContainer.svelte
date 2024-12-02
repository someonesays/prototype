<script lang="ts">
import Logo from "$lib/components/icons/Logo.svelte";
import GearIcon from "$lib/components/icons/GearIcon.svelte";
import DoorOpen from "$lib/components/icons/DoorOpen.svelte";

import { volumeValue } from "$lib/components/stores/settings";
import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import { room, roomWs } from "$lib/components/stores/roomState";
import { ClientOpcodes } from "@/public";
import { Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

let isSettingsOpen = $state(false);

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
  <div class="app-container">
    <div class="content-container">
      <div class="nav-container">
        <div class="left">
          {#if $launcher === "normal"}
            <button class="button leave" onclick={leaveGame}>
              <div><DoorOpen /></div>
            </button>
          {/if}
        </div>
        <div class="center">
          <div class="logo">
            <Logo />
          </div>
        </div>
        <div class="right">
          <button class="button settings" class:active={isSettingsOpen} onclick={() => isSettingsOpen = !isSettingsOpen}>
            <div><GearIcon /></div>
          </button>
          <div class="settings-menu" class:active={isSettingsOpen}>
            <div>
              <div>
                <p class="volume-text-left">Volume</p>
                <p class="volume-text-right">{$volumeValue}%</p>
              </div>
              <br>
              <input class="volume-slider" type="range" min="0" max="100" bind:value={$volumeValue} />
            </div>
          </div>
        </div>
      </div>
      <div class="main-container">
        <h2>Players</h2>
        <ul>
          {#each $room.players.sort((a, b) => b.points - a.points) as player}
            <li>
              <img src={player.avatar} width="50" height="50" alt="{player.displayName}'s avatar" />
              {player.displayName}{$room.room.host === player.id ? " [HOST]" : ""}:
              {player.points} point{player.points === 1 ? "": "s"}
      
              {#if $room.room.host === $room.user && $room.user !== player.id}
                <button onclick={() => kickPlayer(player.id)}>
                  Kick
                </button>
                <button onclick={() => transferHost(player.id)}>
                  Transfer Host
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      
        <h2>Minigame information</h2>
        <p>Pack: {$room.pack ? JSON.stringify($room.pack) : "None"}</p>
        <p>Minigame: {$room.minigame ? JSON.stringify($room.minigame) : "None"}</p>
      
        {#if $room.pack?.iconImage}
          <p>Pack icon image:</p>
          <p>
            <img alt="pack preview" src={
              $launcher === "normal"
                ? $room.pack.iconImage.normal
                : $room.pack.iconImage.discord
            } width="100" height="100" />
          </p>
        {/if}
      
        {#if $room.minigame?.previewImage}
          <p>Minigame preview image:</p>
          <p>
            <img alt="minigame preview" src={
              $launcher === "normal"
                ? $room.minigame.previewImage.normal
                : $room.minigame.previewImage.discord
            } width="100" height="100" />
          </p>
        {/if}
      
        {#if $room.room.host === $room.user}
          <form onsubmit={setSettings}>
            <input type="text" name="pack_id" placeholder="Pack ID">
            <input type="text" name="minigame_id" placeholder="Minigame ID">
            <input type="submit" value="Set pack/minigame">
          </form>
        {/if}
      
        <h2>Actions</h2>
        {#if $room.minigame && !$room.minigame.supportsMobile && $room.players.find(p => p.mobile)}
          <p>WARNING: There is at least one mobile player in this lobby and this minigame doesn't support mobile devices!</p>
        {/if}
        <p>
          <button onclick={copyInviteLink}>Invite</button>
          <button onclick={startGame} disabled={$room.room.host !== $room.user}>Start</button>
        </p>
      </div>
    </div>
  </div>
{:else}
  <p>TODO: Make a loading screen animation of the lobby here!</p>
{/if}

<style>
.app-container {
  height: 100vh;
  display: grid;
  align-items: center;
  vertical-align: middle;
  overflow: auto;
  overflow-wrap: anywhere;
}
.content-container {
  height: calc(100% - 8vh);
  margin: 4vh;
}
.nav-container {
  display: flex;
  align-content: center;
  justify-content: center;
}
.nav-container > .left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.nav-container > .center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.nav-container > .right {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.logo {
  width: calc(100px + 5vh);
}

.settings-menu {
  position: absolute;
  margin-top: 150px;
  text-align: right;
}

@media only screen and (max-width: 480px) {
  .content-container {
    height: calc(100% - 4vh);
    margin: 2vh;
  }
  .nav-container {
    display: flex;
    width: 100%;
  }
  .logo {
    display :none;
  }
}
</style>
