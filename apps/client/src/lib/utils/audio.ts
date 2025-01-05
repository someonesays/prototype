export const audio = {
  press: loadAudio("/audio/press.mp3", 0.6),
  close: loadAudio("/audio/close.mp3"),
  start: loadAudio("/audio/start.mp3"),
};

function loadAudio(fileName: string, volume = 1) {
  const file = new Audio(fileName);
  file.volume = volume;

  return {
    file,
    play: () => (file.cloneNode(true) as HTMLAudioElement).play(),
  };
}
