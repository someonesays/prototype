<script lang="ts">
import { launcher, launcherDiscordSdk } from "$lib/components/stores/launcher";
import { room, roomWs } from "$lib/components/stores/roomState";
import { ClientOpcodes } from "@/public";
import { Permissions, PermissionUtils } from "@discord/embedded-app-sdk";

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

  {#if $room.room.host === $room.user}
    <form onsubmit={setSettings}>
      <input type="text" name="pack_id" placeholder="Pack ID" value="aq23ndwgztlt16vjwz">
      <input type="text" name="minigame_id" placeholder="Minigame ID" value="whwj9rs8vvd6alyznh">
      <input type="submit" value="Set pack/minigame">
    </form>
  {/if}

  <h2>Actions</h2>
  <p>
    <button onclick={() => copyInviteLink()}>Invite</button>
    <button onclick={() => startGame()} disabled={$room.room.host !== $room.user}>Start</button>
    {#if $launcher === "normal"}
      <button onclick={() => leaveGame()}>Leave room</button>
    {/if}
  </p>
{:else}
  <p>TODO: Make a loading screen animation of the lobby here!</p>
{/if}
