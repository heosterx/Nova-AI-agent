<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, CheckSquare } from 'lucide-svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { listTasks, createTask, updateTask, deleteTask as deleteTaskApi, type Task } from '$lib/api/tasks';
  import { toasts } from '$lib/stores/toast';

  let tasks: Task[] = $state([]);
  let showAddModal = $state(false);
  let newTitle = $state('');
  let newDescription = $state('');
  let newDueAt = $state('');
  let loading = $state(true);

  const pending = $derived(tasks.filter((t) => t.status === 'pending'));
  const inProgress = $derived(tasks.filter((t) => t.status === 'in_progress'));
  const completed = $derived(tasks.filter((t) => t.status === 'completed'));

  onMount(async () => {
    try {
      const result = await listTasks();
      tasks = result.tasks;
    } catch (err) {
      toasts.error('Failed to load tasks');
    } finally {
      loading = false;
    }
  });

  async function handleAdd() {
    if (!newTitle.trim()) return;
    try {
      const result = await createTask(newTitle, newDescription || undefined, newDueAt || undefined);
      tasks = [result.task, ...tasks];
      newTitle = '';
      newDescription = '';
      newDueAt = '';
      showAddModal = false;
      toasts.success('Task created');
    } catch (err) {
      toasts.error('Failed to create task');
    }
  }

  async function handleStatusChange(id: string, status: Task['status']) {
    try {
      await updateTask(id, { status });
      tasks = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    } catch (err) {
      toasts.error('Failed to update task');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTaskApi(id);
      tasks = tasks.filter((t) => t.id !== id);
      toasts.success('Task deleted');
    } catch (err) {
      toasts.error('Failed to delete task');
    }
  }
</script>

<svelte:head>
  <title>Tasks - Nova</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <CheckSquare size={24} class="text-accent-primary" />
      <h1 class="font-mono font-bold text-xl">Tasks</h1>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary text-white text-sm hover:bg-accent-glow transition-colors"
    >
      <Plus size={16} />
      Add Task
    </button>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each Array(3) as _}
        <div class="space-y-3">
          <div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse h-20"></div>
          <div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse h-20"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Pending ({pending.length})
        </h3>
        <div class="space-y-3">
          {#each pending as task (task.id)}
            <TaskCard {task} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          {/each}
          {#if pending.length === 0}
            <p class="text-xs text-text-secondary/50 text-center py-4">No pending tasks</p>
          {/if}
        </div>
      </div>

      <div>
        <h3 class="text-sm font-medium text-accent-amber uppercase tracking-wider mb-3">
          In Progress ({inProgress.length})
        </h3>
        <div class="space-y-3">
          {#each inProgress as task (task.id)}
            <TaskCard {task} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          {/each}
          {#if inProgress.length === 0}
            <p class="text-xs text-text-secondary/50 text-center py-4">Nothing in progress</p>
          {/if}
        </div>
      </div>

      <div>
        <h3 class="text-sm font-medium text-accent-green uppercase tracking-wider mb-3">
          Completed ({completed.length})
        </h3>
        <div class="space-y-3">
          {#each completed as task (task.id)}
            <TaskCard {task} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          {/each}
          {#if completed.length === 0}
            <p class="text-xs text-text-secondary/50 text-center py-4">Nothing completed yet</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<Modal title="Add Task" open={showAddModal} onClose={() => (showAddModal = false)}>
  <div class="flex flex-col gap-4">
    <div>
      <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Title</label>
      <input
        type="text"
        bind:value={newTitle}
        placeholder="What needs to be done?"
        class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
      />
    </div>
    <div>
      <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Description (optional)</label>
      <textarea
        bind:value={newDescription}
        rows={3}
        placeholder="Add details..."
        class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none resize-none"
      ></textarea>
    </div>
    <div>
      <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Due Date (optional)</label>
      <input
        type="datetime-local"
        bind:value={newDueAt}
        class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
      />
    </div>
    <button
      onclick={handleAdd}
      disabled={!newTitle.trim()}
      class="w-full py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Create Task
    </button>
  </div>
</Modal>
