<script lang="ts">
  import { ChevronDown, ChevronRight, Wrench } from 'lucide-svelte';

  interface Props {
    name: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  }

  let { name, input, output }: Props = $props();
  let expanded = $state(false);
</script>

<div class="mx-8 my-1">
  <button
    onclick={() => (expanded = !expanded)}
    class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:bg-bg-tertiary transition-colors w-full text-left"
  >
    <Wrench size={14} class="text-accent-amber shrink-0" />
    <span class="font-mono text-xs text-text-secondary">{name}</span>
    {#if expanded}
      <ChevronDown size={14} class="text-text-secondary ml-auto" />
    {:else}
      <ChevronRight size={14} class="text-text-secondary ml-auto" />
    {/if}
  </button>

  {#if expanded}
    <div class="mt-1 ml-6 p-3 rounded-lg bg-bg-tertiary border border-border">
      {#if input}
        <div class="mb-2">
          <span class="text-[10px] uppercase tracking-wider text-text-secondary">Input</span>
          <pre class="text-xs font-mono text-text-primary mt-1 overflow-x-auto">{JSON.stringify(input, null, 2)}</pre>
        </div>
      {/if}
      {#if output}
        <div>
          <span class="text-[10px] uppercase tracking-wider text-text-secondary">Output</span>
          <pre class="text-xs font-mono text-accent-green mt-1 overflow-x-auto">{JSON.stringify(output, null, 2)}</pre>
        </div>
      {/if}
    </div>
  {/if}
</div>
