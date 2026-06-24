<script lang="ts">
  import { Copy, Check, RotateCcw } from 'lucide-svelte';
  import type { Message } from '$lib/stores/chat';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();
  let copied = $state(false);

  async function copyContent() {
    await navigator.clipboard.writeText(message.content);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div
  class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} group"
>
  <div
    class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
      {message.role === 'user'
        ? 'bg-accent-primary text-white rounded-br-md'
        : 'bg-bg-secondary text-text-primary border border-border rounded-bl-md'}"
  >
    <div class="whitespace-pre-wrap break-words">{message.content}</div>

    {#if message.content}
      <div class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onclick={copyContent}
          class="p-1 rounded hover:bg-white/10 transition-colors"
          title="Copy"
        >
          {#if copied}
            <Check size={14} class="text-accent-green" />
          {:else}
            <Copy size={14} class="text-text-secondary" />
          {/if}
        </button>
        {#if message.role === 'assistant' && message.model}
          <span class="text-[10px] text-text-secondary ml-2">{message.model}</span>
        {/if}
      </div>
    {/if}
  </div>
</div>
