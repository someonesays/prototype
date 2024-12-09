<script>
import HomeContainer from "$lib/components/pages/HomeContainer.svelte";

import { onMount } from "svelte";
import { page } from "$app/stores";
import env from "$lib/utils/env";
import { goto } from "$app/navigation";
import { ErrorMessageCodes, ErrorMessageCodesToText, RoomWebsocket } from "@/public";
import { roomIdToJoin, kickedReason } from "$lib/components/stores/home/lobby";

onMount(() => {
  const roomId = $page.params.roomId;
  (async () => {
    const exists = await RoomWebsocket.getIfRoomExists({
      roomId,
      // You'll never run into /join/[roomId] unless you connect to the website to it,
      // so I don't need to worry about changing the 'launcher' store value.
      baseUrl: env.VITE_BASE_API,
    });

    if (!exists) {
      goto("/");
      $kickedReason = ErrorMessageCodesToText[ErrorMessageCodes.ROOM_NOT_FOUND];

      return;
    }

    $roomIdToJoin = roomId;
  })();
});
</script>

<HomeContainer />
