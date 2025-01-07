<script lang="ts">
import { launcher, launcherDiscordSdk } from "$lib/stores/home/launcher";
import { isModalOpen } from "$lib/stores/home/modal";
import { roomLobbyPopupMessage } from "$lib/stores/home/roomState";

// (lazy code)

export let href = "";
export let title = undefined;

function openUrl(evt: MouseEvent) {
  evt.preventDefault();
  const url = (evt.target as HTMLLinkElement).href;

  switch ($launcher) {
    case "normal":
      try {
        if (["someonesays.io", "www.someonesays.io"].includes(new URL(url).hostname)) {
          return window.open(url, "_blank");
        }
      } catch (err) {}
      $roomLobbyPopupMessage = { type: "link", url };
      $isModalOpen = true;
      break;
    case "discord":
      $launcherDiscordSdk?.commands.openExternalLink({ url });
      break;
  }
}
</script>

<a {href} {title} class="url" data-sveltekit-preload-data="off" onclick={openUrl} tabindex={$isModalOpen ? -1 : 0}>
  <slot></slot>
</a>
