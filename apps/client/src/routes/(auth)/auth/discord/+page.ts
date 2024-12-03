import env from "$lib/utils/env";
import { getCookie, setCookie } from "$lib/utils/cookies.js";
import { ErrorMessageCodes, ErrorMessageCodesToText } from "@/public";
import { goto } from "$app/navigation";

export async function load({ fetch, url }) {
  try {
    const oauth2Code = url.searchParams.get("code");
    const oauth2State = url.searchParams.get("state");

    if (!oauth2Code || (oauth2State && oauth2State !== getCookie("state"))) {
      const state = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      setCookie("state", state);
      location.href = `${env.VITE_BASE_API}/api/auth/discord/login?state=${state}&local=${!env.VITE_IS_PROD}`;
      return;
    }

    setCookie("state", "");

    const res = await fetch(
      `${env.VITE_BASE_API}/api/auth/discord/callback?code=${encodeURIComponent(oauth2Code)}${env.VITE_MODE === "staging" && !env.VITE_IS_PROD ? "&local=true" : ""}`,
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
