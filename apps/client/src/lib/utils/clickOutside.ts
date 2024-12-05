export function clickOutside(node: HTMLElement, callback: () => boolean): { destroy: () => void } {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      callback();
    }
  };
  document.addEventListener("mouseup", handleClick, true);
  return {
    destroy() {
      document.removeEventListener("mouseup", handleClick, true);
    },
  };
}
