<script lang="ts">
let { shape = "", color = "" } = $props();

const colors = {
  aqua: ["#c0fffe", "#478d8d", "#cdbcff", "#94d2ee"],
  blue: ["#a6afff", "#666ca0", "#adc8ff", "#b1feff"],
  brown: ["#c1995d", "#8d6e3f", "#ffc6a3", "#ffdea0"],
  gray: ["#c9c9c9", "#686868", "#fafafa", "#d3d3d3"],
  green: ["#6ce57e", "#488850", "#bdffc4", "#96f6dd"],
  orange: ["#ff9640", "#855936", "#ffe5ce", "#ffb685"],
  pink: ["#fec0ff", "#907390", "#ffdbfd", "#ffb0d0"],
  purple: ["#d294ff", "#75548d", "#ffc9ea", "#d285ff"],
  red: ["#ff9c9c", "#9e6060", "#ff9898", "#ffcfd4"],
  yellow: ["#fff783", "#888446", "#ffd78d", "#fff1aa"],
};

let fill = $derived(colors[color as keyof typeof colors][0]);
let stroke = $derived(colors[color as keyof typeof colors][1]);
let gradientLeft = $derived(colors[color as keyof typeof colors][2]);
let gradientRight = $derived(colors[color as keyof typeof colors][3]);
</script>

<div class="avatar" style={`background: linear-gradient(${gradientLeft}, ${gradientRight});`}>
  {#if shape === "circle"}
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="45" cy="45" r="42.5" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "diamond"}
    <svg width="81" height="104" viewBox="0 0 81 104" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.16879 52L40.5 4.06858L77.8312 52L40.5 99.9314L3.16879 52Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "half"}
    <svg width="99" height="99" viewBox="0 0 99 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="path-1-inside-1_2349_53" fill="white">
    <path d="M99 0.5C99 7.00043 97.7196 13.4372 95.232 19.4428C92.7444 25.4484 89.0983 30.9053 84.5018 35.5018C79.9053 40.0983 74.4484 43.7444 68.4428 46.232C62.4372 48.7196 56.0004 50 49.5 50C42.9996 50 36.5628 48.7196 30.5572 46.232C24.5516 43.7444 19.0947 40.0983 14.4982 35.5018C9.90171 30.9053 6.25557 25.4484 3.76796 19.4428C1.28035 13.4372 -5.68286e-07 7.00043 0 0.499996L49.5 0.5H99Z"/>
    </mask>
    <path d="M99 0.5C99 7.00043 97.7196 13.4372 95.232 19.4428C92.7444 25.4484 89.0983 30.9053 84.5018 35.5018C79.9053 40.0983 74.4484 43.7444 68.4428 46.232C62.4372 48.7196 56.0004 50 49.5 50C42.9996 50 36.5628 48.7196 30.5572 46.232C24.5516 43.7444 19.0947 40.0983 14.4982 35.5018C9.90171 30.9053 6.25557 25.4484 3.76796 19.4428C1.28035 13.4372 -5.68286e-07 7.00043 0 0.499996L49.5 0.5H99Z" fill={fill} stroke={stroke} stroke-width="10" mask="url(#path-1-inside-1_2349_53)"/>
    </svg>
  {:else if shape === "heptagon"}
    <svg width="87" height="85" viewBox="0 0 87 87" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.8779 18.4848L43.5 2.77479L76.1221 18.4848L84.1791 53.7847L61.6039 82.0931H25.3961L2.82093 53.7847L10.8779 18.4848Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "hexagon"}
    <svg width="79" height="89" viewBox="0 0 79 89" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.46187 23.6934L39.5 2.88675L75.5381 23.6934V65.3066L39.5 86.1133L3.46187 65.3066V23.6934Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "pentagon"}
    <svg width="85" height="81" viewBox="0 0 85 85" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.11691 31.7037L42.5 3.09017L81.8831 31.7037L66.8401 78.0013H18.1599L3.11691 31.7037Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "square"}
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="75" height="75" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "star"}
    <svg width="99" height="94" viewBox="0 0 99 99" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M49.5 8.09017L58.6848 36.3582L59.2461 38.0856H61.0625H90.7852L66.739 55.5562L65.2695 56.6238L65.8308 58.3513L75.0157 86.6193L50.9695 69.1487L49.5 68.0811L48.0305 69.1487L23.9843 86.6193L33.1692 58.3513L33.7305 56.6238L32.261 55.5562L8.21479 38.0856H37.9375H39.7539L40.3152 36.3582L49.5 8.09017Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {:else if shape === "triangle"}
    <svg width="96" height="83" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.69873 80L48 5L91.3013 80H4.69873Z" fill={fill} stroke={stroke} stroke-width="5"/>
    </svg>
  {/if}
</div>

<style>
  .avatar {
    display: flex;
    margin: auto;
    align-items: center;
    justify-content: center;
    border-radius: 100px;
    width: 126px;
    height: 126px;
  }
</style>
