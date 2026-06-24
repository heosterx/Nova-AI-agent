<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, Brain } from 'lucide-svelte';
  import MemoryCard from '$lib/components/MemoryCard.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { listMemories, createMemory, deleteMemory as deleteMemoryApi, type Memory } from '$lib/api/memory';
  import { toasts } from '$lib/stores/toast';

  let memories: Memory[] = $state([]);
  let searchQuery = $state('');
  let selectedCategory = $state('');
  let showAddModal = $state(false);
  let newContent = $state('');
  let newCategory = $state('fact');
  let loading = $state(true);

  const categories = ['fact', 'preference', 'project', 'contact', 'goal', 'custom'];

  const filteredMemories = $derived(
    memories.filter((m) => {
      if (selectedCategory && m.category !== selectedCategory) return false;
      if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
  );

  onMount(async () => {
    try {
      const result = await listMemories();
      memories = result.memories;
    } catch (err) {
      toasts.error('Failed to load memories');
    } finally {
      loading = false;
    }
  });

  async function handleAdd() {
    if (!newContent.trim()) return;
    try {
      const result = await createMemory(newContent, newCategory);
      memories = [result.memory, ...memories];
      newContent = '';
      showAddModal = false;
      toasts.success('Memory stored');
    } catch (err) {
      toasts.error('Failed to store memory');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemoryApi(id);
      memories = memories.filter((m) => m.id !== id);
      toasts.success('Memory deleted');
    } catch (err) {
      toasts.error('Failed to delete memory');
    }
  }
</script>

<svelte:head>
  <title>Memory - Nova</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <Brain size={24} class="text-accent-primary" />
      <h1 class="font-mono font-bold text-xl">Memory</h1>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary text-white text-sm hover:bg-accent-glow transition-colors"
    >
      <Plus size={16} />
      Add Memory
    </button>
  </div>

  <div class="flex items-center gap-3 mb-4">
    <div class="relative flex-1">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search memories..."
        class="w-full bg-bg-tertiary border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none"
      />
    </div>
    <select
      bind:value={selectedCategory}
      class="bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
    >
      <option value="">All categories</option>
      {#each categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each Array(4) as _}
        <div class="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse h-24"></div>
      {/each}
    </div>
  {:else if filteredMemories.length === 0}
    <div class="text-center py-16">
      <Brain size={48} class="mx-auto text-text-secondary/30 mb-4" />
      <p class="text-text-secondary">No memories yet. Start a conversation or add one manually.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each filteredMemories as memory (memory.id)}
        <MemoryCard {memory} onDelete={handleDelete} />
      {/each}
    </div>
  {/if}
</div>

<Modal title="Add Memory" open={showAddModal} onClose={() => (showAddModal = false)}>
  <div class="flex flex-col gap-4">
    <div>
      <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Category</label>
      <select
        bind:value={newCategory}
        class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
      >
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="text-xs text-text-secondary uppercase tracking-wider mb-1 block">Content</label>
      <textarea
        bind:value={newContent}
        rows={4}
        placeholder="What should Nova remember?"
        class="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-accent-primary focus:outline-none resize-none"
      ></textarea>
    </div>
    <button
      onclick={handleAdd}
      disabled={!newContent.trim()}
      class="w-full py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Store Memory
    </button>
  </div>
</Modal>
