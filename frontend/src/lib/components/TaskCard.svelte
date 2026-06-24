<script lang="ts">
  import { CheckCircle, Circle, Clock, Trash2, Archive } from 'lucide-svelte';
  import { formatDistanceToNow, isPast } from 'date-fns';
  import type { Task } from '$lib/api/tasks';

  interface Props {
    task: Task;
    onStatusChange?: (id: string, status: Task['status']) => void;
    onDelete?: (id: string) => void;
  }

  let { task, onStatusChange, onDelete }: Props = $props();

  const statusIcons = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle,
    archived: Archive,
  };

  const statusColors = {
    pending: 'text-text-secondary',
    in_progress: 'text-accent-amber',
    completed: 'text-accent-green',
    archived: 'text-text-secondary/50',
  };

  const isOverdue = $derived(task.due_at && isPast(new Date(task.due_at)) && task.status !== 'completed');
</script>

<div class="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent-primary/30 transition-colors group {task.status === 'completed' ? 'opacity-60' : ''}">
  <div class="flex items-start gap-3">
    <button
      onclick={() => {
        const next = task.status === 'completed' ? 'pending' : 'completed';
        onStatusChange?.(task.id, next);
      }}
      class="mt-0.5 shrink-0 {statusColors[task.status]}"
    >
      {#if task.status === 'completed'}
        <CheckCircle size={20} />
      {:else if task.status === 'in_progress'}
        <Clock size={20} />
      {:else if task.status === 'archived'}
        <Archive size={20} />
      {:else}
        <Circle size={20} />
      {/if}
    </button>

    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-text-primary {task.status === 'completed' ? 'line-through' : ''}">{task.title}</p>
      {#if task.description}
        <p class="text-xs text-text-secondary mt-1">{task.description}</p>
      {/if}
      {#if task.due_at}
        <p class="text-[10px] mt-2 {isOverdue ? 'text-accent-red' : 'text-text-secondary'}">
          Due {formatDistanceToNow(new Date(task.due_at), { addSuffix: true })}
        </p>
      {/if}
    </div>

    <button
      onclick={() => onDelete?.(task.id)}
      class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary transition-all"
    >
      <Trash2 size={14} class="text-accent-red" />
    </button>
  </div>
</div>
