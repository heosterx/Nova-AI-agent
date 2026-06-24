<script lang="ts">
  import { chatStore } from '$lib/stores/chat';
  import ChatBubble from '$lib/components/ChatBubble.svelte';
  import ToolCallCard from '$lib/components/ToolCallCard.svelte';
  import { Cpu } from 'lucide-svelte';

  const messages = $derived($chatStore.messages);
  const isStreaming = $derived($chatStore.isStreaming);
</script>

<svelte:head>
  <title>Chat - Nova</title>
</svelte:head>

<div class="max-w-3xl mx-auto flex flex-col gap-4 pb-4">
  {#if messages.length === 0}
    <div class="flex flex-col items-center justify-center h-[60vh] text-center">
      <div class="p-4 rounded-2xl bg-bg-secondary border border-border mb-4">
        <Cpu size={32} class="text-accent-primary" />
      </div>
      <h2 class="font-mono font-bold text-xl text-text-primary mb-2">Welcome to Nova</h2>
      <p class="text-text-secondary text-sm max-w-md">
        Your personal AI agent. Ask me anything, manage tasks, store memories, or switch to voice mode.
      </p>
      <div class="flex flex-wrap gap-2 mt-6 justify-center">
        {#each ['What can you do?', 'Create a task', 'Remember something', 'Search the web'] as prompt}
          <button class="px-3 py-1.5 rounded-full bg-bg-secondary border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors">
            {prompt}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    {#each messages as message (message.id)}
      <ChatBubble {message} />
      {#if message.toolName}
        <ToolCallCard
          name={message.toolName}
          input={message.toolInput}
          output={message.toolOutput}
        />
      {/if}
    {/each}

    {#if isStreaming}
      <div class="flex items-center gap-1 px-4 py-2">
        <span class="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
        <span class="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" style="animation-delay: 0.2s"></span>
        <span class="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" style="animation-delay: 0.4s"></span>
      </div>
    {/if}
  {/if}
</div>
