export const queryParams = new URLSearchParams(window.location.search);
export const isEmbedded = queryParams.get("frame_id") != null;
