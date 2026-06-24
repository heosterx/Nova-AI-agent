<script lang="ts">
  import { Pencil, Trash2, Clock } from 'lucide-svelte';
  import { formatDistanceToNow } from 'date-fns';
  import type { Memory } from '$lib/api/memory';

  interface Props {
    memory: Memory;
    onEdit?: (memory: Memory) => void;
    onDelete?: (id: string) => void;
  }

  let { memory, onEdit, onDelete }: Props = $props();

  const categoryColors: Record<string, string> = {
    fact: 'bg-accent-primary/20 text-accent-primary',
    preference: 'bg-accent-green/20 text-accent-green',
    project: 'bg-accent-amber/20 text-accent-amber',
    contact: 'bg-accent-cyan/20 text-accent-cyan',
    goal: 'bg-accent-red/20 text-accent-red',
    custom: 'bg-text-secondary/20 text-text-secondary',
  };
</script>

<div class="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent-primary/30 transition-colors group">
  <div class="flex items-start justify-between gap-2 mb-2">
    <span class="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider {categoryColors[memory.category] || categoryColors.custom}">
      {memory.category}
    </span>
    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {#if onEdit}
        <button onclick={() => onEdit?.(memory)} class="p-1 rounded hover:bg-bg-tertiary">
          <Pencil size={12} class="text-text-secondary" />
        </button>
      {/if}
      {#if onDelete}
        <button onclick={() => onDelete?.(memory.id)} class="p-1 rounded hover:bg-bg-tertiary">
          <Trash2 size={12} class="text-accent-red" />
        </button>
      {/if}
    </div>
  </div>

  <p class="text-sm text-text-primary leading-relaxed">{memory.content}</p>

  <div class="flex items-center gap-1 mt-3 text-[10px] text-text-secondary">
    <Clock size={10} />
    <span>{formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}</span>
  </div>
</div>
