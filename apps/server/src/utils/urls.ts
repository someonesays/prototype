import env from "@/env";

export const developmentUrl = `http://localhost:${env.VitePort}`;
// export const developmentWebSocket = `ws://localhost:${env.VitePort}`;

export const developmentCsp = env.NodeEnv === "production" ? [] : [developmentUrl];
