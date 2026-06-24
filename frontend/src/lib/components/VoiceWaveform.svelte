<script lang="ts">
  interface Props {
    state: 'idle' | 'recording' | 'playing' | 'error';
  }

  let { state }: Props = $props();
  const bars = Array.from({ length: 24 }, (_, i) => i);
</script>

<div class="flex items-center justify-center gap-0.5 h-16">
  {#each bars as bar}
    <div
      class="w-1 rounded-full transition-all duration-150
        {state === 'error' ? 'bg-accent-red h-0.5' : ''}
        {state === 'idle' ? 'bg-accent-cyan/30 h-1' : ''}
        {state === 'recording' ? 'bg-accent-cyan' : ''}
        {state === 'playing' ? 'bg-accent-primary' : ''}"
      style={state === 'recording' || state === 'playing'
        ? `height: ${12 + Math.random() * 40}px; animation: wave 0.6s ease-in-out infinite; animation-delay: ${bar * 0.05}s;`
        : ''}
    ></div>
  {/each}
</div>

<style>
  @keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50% { transform: scaleY(1); }
  }
</style>
