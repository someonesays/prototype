import { isEmbedded } from "./discord";

export const VITE_BASE_API = !isEmbedded ? import.meta.env.VITE_BASE_API || "" : "/.proxy";
