<script lang="ts">
let { children } = $props();
</script>

<style>
  :root {
    --primary-background: #ece2fc;
    --secondary-background: #fafafa;
    
    --primary-button: #5812e2;
    --success-button: #23a55a;
    --error-button: #aa0e32;
    --secondary-button: #4c5660;

    --primary-text: #000000;
    --secondary-text: #242424;
    
    --card-stroke: #b3b3b3; 
    --settings-button: #343a40;
    --report-flag: #ff0000;

    --bg-gradient-1: #611ded;
    --bg-gradient-2: #f588c1;
    --bg-checkers: #ffffff14;
    --bg-glow: #ff93f880;
  }
  .room {
    position: absolute;
    background: linear-gradient(90deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 100%);
    width: 100%;
    height: 100%;
  }
  .pattern {
    position: absolute;
    background-image: linear-gradient(45deg, var(--bg-checkers) 25%, transparent 25%), linear-gradient(-45deg, var(--bg-checkers) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--bg-checkers) 75%), linear-gradient(-45deg, transparent 75%, var(--bg-checkers) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    width: 100%;
    height: 100%;
  }
  .glow {
    position: absolute;
    background: radial-gradient(50% 50% at 50% 50%, var(--bg-glow) 0%, rgba(255, 255, 255, 0) 100%);
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>

<div class="room">
  <div class="pattern">
    <div class="glow">
      {@render children()}
    </div>
  </div>
</div>
