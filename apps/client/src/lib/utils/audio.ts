import { volumeValue } from "$lib/stores/home/settings";
import { get } from "svelte/store";
import { setCookie } from "./cookies";

export const playingAudio = new Set<HTMLAudioElement>();

volumeValue.subscribe((value) => {
  setCookie("volume", value.toString());

  for (const audio of playingAudio.values()) {
    audio.volume = value / 100;
  }
});

export const audio = {
  press: loadAudio("/audio/press.mp3"),
  close: loadAudio("/audio/close.mp3"),
  start: loadAudio("/audio/start.mp3"),
};

function loadAudio(fileName: string) {
  const file = new Audio(fileName);
  return {
    file,
    play: () => {
      const clonedAudio = file.cloneNode(true) as HTMLAudioElement;
      clonedAudio.volume = get(volumeValue) / 100;

      playingAudio.add(clonedAudio);

      clonedAudio.addEventListener("ended", () => {
        playingAudio.delete(clonedAudio);
      });
      clonedAudio.addEventListener("pause", () => {
        playingAudio.delete(clonedAudio);
        clonedAudio.currentTime = clonedAudio.duration;
      });
      clonedAudio.addEventListener("error", () => playingAudio.delete(clonedAudio));

      clonedAudio.play();
    },
  };
}
