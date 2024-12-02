<script lang="ts">
let { children } = $props();
</script>

<style>
  .container {
    position: absolute;
    background: linear-gradient(90deg, var(--bg-gradient-primary-1) 0%, var(--bg-gradient-primary-2) 100%);
    width: 100%;
    height: 100%;

    animation-duration: 2s;
    animation-fill-mode: forwards;
  }
  .child-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    overflow: auto;
    word-wrap: break-word;
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
    
    animation-name: pattern-fade-in;
    animation-duration: 1.5s;
    animation-fill-mode: forwards;
    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  }
  .glow {
    position: absolute;
    top: 0;
    background: radial-gradient(50% 50% at 50% 50%, var(--bg-glow) 0%, #ffffff00 100%);
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  @keyframes pattern-fade-in {
    0% {
      background-color: #000000;
      transform: scale(1.5);
    }
    100% {
      background-color: #ffffff;
      transform: scale(1);
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

.screen-too-small {
  position: absolute;
  top: 0;
  color: white;
  display: none;
  text-align: center;
}

@media only screen and (width < 320px) {
  .container {
    background: black;
  }
  .pattern {
    display: none;
  }
  .glow {
    display: none;
  }
  .child-container {
    display: none;
  }
  .screen-too-small {
    display: block;
  }
}

</style>

<div class="container">
  <div class="pattern"></div>
  <div class="glow"></div>

  <div class="child-container">
    {@render children()}
  </div>
  <div class="screen-too-small">
    <p>Your screen's width must be at least 320px!</p>
  </div>
</div>
