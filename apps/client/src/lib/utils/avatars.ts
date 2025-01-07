export const shapes = ["circle", "diamond", "half", "heptagon", "hexagon", "pentagon", "square", "star", "triangle"];
export const colors = ["aqua", "blue", "brown", "gray", "green", "orange", "pink", "purple", "red", "yellow"];

export function randomShape() {
  return shapes[Math.floor(Math.random() * shapes.length)];
}

export function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}
