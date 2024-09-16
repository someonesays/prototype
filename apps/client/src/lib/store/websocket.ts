import { writable } from "svelte/store";

const messageStore = writable();
let ws: WebSocket;

export function connect(connection: string) {
  if (ws?.readyState <= 1) ws.close();

  ws = new WebSocket(connection);

  ws.onopen = (evt) => {};
  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
  };
  ws.onclose = (evt) => {};
}

function sendMessage(msg) {
  if (ws?.readyState <= 1) {
    ws.send(msg);
  }
}

export default {
  subscribe: messageStore.subscribe,
  sendMessage,
};
