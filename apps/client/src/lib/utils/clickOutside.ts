export function clickOutside(node: HTMLElement, callback: () => boolean): { destroy: () => void } {
  let clicking = false;
  const handleMouseDown = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      clicking = true;
      return;
    }
    clicking = false;
  };
  const handleMouseUp = (event: MouseEvent) => {
    if (clicking && !node.contains(event.target as Node)) {
      return callback();
    }
    clicking = false;
  };
  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("mouseup", handleMouseUp, true);
  return {
    destroy() {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
    },
  };
}
