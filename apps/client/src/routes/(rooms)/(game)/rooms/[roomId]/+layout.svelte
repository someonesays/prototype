<script lang="ts">
let { children } = $props();
</script>

<style>
  .black-bg {
    position: absolute;
    background: #000000;
    width: 100%;
    height: 100%;
  }
  .container {
    position: absolute;
    width: 100%;
    height: 100%;

    /* animation-name: container-fade-out; */
    animation-duration: 2s;
    animation-fill-mode: forwards;
  }
  .child-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    overflow: auto;
  }
  .primary-bg {
    position: absolute;
    background: linear-gradient(90deg, var(--bg-gradient-primary-1) 0%, var(--bg-gradient-primary-2) 100%);
    width: 100%;
    height: 100%;

    /* animation-name: primary-bg-fade-out; */
    animation-duration: 2s;
    animation-fill-mode: forwards;
  }
  .pattern {
    position: relative;
    background: #ffffff;
    filter: contrast(50) invert();
    mix-blend-mode: lighten;
    opacity: 10%;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .pattern::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at center, #000000 0%, transparent 100%);
    background-size: 1rem 1rem;
    background-repeat: round;
    background-position: center;
    mask-image: radial-gradient(#000000, #0000004d);
    
    /* animation-name: pattern-fade-out; */
    animation-duration: 2s;
    animation-fill-mode: forwards;
  }
  .glow {
    position: absolute;
    top: 0;
    background: radial-gradient(50% 50% at 50% 50%, var(--bg-glow) 0%, #ffffff00 100%);
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  @keyframes container-fade-out {
    from {
      opacity: 100%;
    }
    to {
      opacity: 0%;
    }
  }
  @keyframes primary-bg-fade-out {
    from {
      opacity: 100%;
    }
    to {
      opacity: 0%;
    }
  }
  @keyframes pattern-fade-out {
    0% {
      background-color: #ffffff;
      transform: scale(1);
    }
    100% {
      background-color: #000000;
      transform: scale(1.5);
    }
  }
</style>

<div class="black-bg"></div>

<div class="container">
  <div class="primary-bg">
    <div class="glow"></div>
  </div>
  <div class="pattern"></div>

  <div class="child-container">
    {@render children()}
  </div>
</div>
