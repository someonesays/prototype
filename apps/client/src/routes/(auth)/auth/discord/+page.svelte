<script lang="ts">
import env from "$lib/utils/env";
import { onMount } from "svelte";
import { setCookie } from "$lib/utils/cookies.js";
import { ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { page } from "$app/stores";
import { goto } from "$app/navigation";
import { isModalOpen } from "$lib/stores/home/modal";
import { kickedReason } from "$lib/stores/home/lobby";

onMount(() => {
  (async () => {
    try {
      const error = $page.url.searchParams.get("error");
      if (error) return goto("/");

      const res = await fetch(
        `${env.VITE_BASE_API}/api/auth/discord/callback?code=${encodeURIComponent($page.url.searchParams.get("code") ?? "")}&state=${encodeURIComponent($page.url.searchParams.get("state") ?? "")}`,
        { credentials: "include" },
      );

      const { code, authorization } = (await res.json()) as { code: ErrorMessageCodes; authorization: string };
      if (!authorization) {
        $isModalOpen = true;
        $kickedReason = ErrorMessageCodesToText[code];
        return goto("/");
      }

      setCookie("token", authorization);
      return goto("/developers");
    } catch (err) {
      console.error(err);
      return goto("/");
    }
  })();
});
</script>

<p>Loading...</p>
