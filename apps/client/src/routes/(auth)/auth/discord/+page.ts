import env from "$lib/utils/env";
import { setCookie } from "$lib/utils/cookies.js";
import { ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { goto } from "$app/navigation";

export async function load({ fetch, url }) {
  try {
    const res = await fetch(
      `${env.VITE_BASE_API}/api/auth/discord/callback?code=${encodeURIComponent(url.searchParams.get("code") ?? "")}&state=${encodeURIComponent(url.searchParams.get("state") ?? "")}`,
      { credentials: "include" },
    );

    const { code, authorization } = (await res.json()) as { code: ErrorMessageCodes; authorization: string };
    if (!authorization) throw new Error(`${ErrorMessageCodesToText[code]}`);

    setCookie("token", authorization);
    return goto("/developers");
  } catch (err) {
    console.error(err);
    return goto("/");
  }
}
