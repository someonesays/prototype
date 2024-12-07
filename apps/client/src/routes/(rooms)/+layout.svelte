<script lang="ts">
import { page } from "$app/stores";

let { children } = $props();
</script>

<style>
  .container, .primary-bg, .secondary-bg {
    position: absolute;
    background: linear-gradient(90deg, var(--bg-gradient-2-primary-1) 0%, var(--bg-gradient-2-primary-2) 100%);
    background-attachment: fixed;
    width: 100%;
    height: 100%;
    min-height: 100%;

    animation-duration: 0.5s;
    animation-fill-mode: forwards;
  }
  .primary-bg {
    background: linear-gradient(90deg, var(--bg-gradient-primary-1) 0%, var(--bg-gradient-primary-2) 100%);
  }
  .secondary-bg {
    background: linear-gradient(90deg, var(--bg-gradient-2-primary-1) 0%, var(--bg-gradient-2-primary-2) 100%);
  }
  .primary-bg, .secondary-bg {
    animation-name: bg-fade-in;
    animation-duration: 0.8s;
  }
  .primary-bg.hide, .secondary-bg.hide {
    animation-name: bg-fade-out;
    animation-duration: 0.8s;
    animation-fill-mode: forwards;
  }
  .child-container {
    position: absolute;
    width: 100%;
    height: 100%;
    min-height: 100%;
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
    min-height: 100%;
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
    animation-duration: 0.8s;
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  }
  .glow {
    position: absolute;
    top: 0;
    background: radial-gradient(50% 50% at 50% 50%, var(--bg-glow) 0%, #ffffff00 100%);
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: auto;
  }
  @keyframes bg-fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  @keyframes bg-fade-out {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
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
</style>

<div class="container">
  <div class="primary-bg" class:hide={!$page.url.pathname.startsWith("/rooms")}></div>
  <div class="secondary-bg" class:hide={$page.url.pathname.startsWith("/rooms")}></div>

  <div class="pattern"></div>
  <div class="glow"></div>

  <div class="child-container">
    {@render children()}
  </div>
</div>
