<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    open: boolean;
    onClose: () => void;
    children: Snippet;
  }

  let { title, open, onClose, children }: Props = $props();

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    onclick={handleBackdrop}
    onkeydown={handleKeydown}
  >
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    <div class="relative glass rounded-2xl w-full max-w-md p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-lg text-text-primary">{title}</h2>
        <button onclick={onClose} class="p-1 rounded-lg hover:bg-bg-tertiary transition-colors">
          <X size={18} class="text-text-secondary" />
        </button>
      </div>
      {@render children()}
    </div>
  </div>
{/if}
